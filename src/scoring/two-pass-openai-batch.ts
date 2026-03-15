import fs from "node:fs/promises";
import path from "node:path";

import type { L4Activity, SkillWithContext } from "../types/hierarchy.js";
import type {
  FilterResult,
  PreScoreResult,
  ScoringResult,
} from "../types/scoring.js";
import type { KnowledgeContext } from "./knowledge-context.js";
import { preScoreAll } from "./deterministic/pre-scorer.js";
import { formatPreScoreTsv } from "../output/format-pre-score-tsv.js";
import { buildConsolidatedPrompt } from "./prompts/consolidated.js";
import { ConsolidatedLensSchema, consolidatedJsonSchema } from "./schemas.js";
import {
  buildAdoptionLensFromDeterministic,
  buildTechnicalLensFromLLM,
  buildValueLensFromDeterministic,
  computeTwoPassComposite,
} from "./consolidated-scorer.js";
import type { OpenAiBatchConfig } from "../infra/openai-batch-client.js";
import {
  extractChatCompletionContent,
  normalizeOpenAiJsonSchema,
  runOpenAiBatch,
  stripNullFields,
} from "../infra/openai-batch-client.js";

export interface TwoPassOpenAiBatchArgs {
  hierarchy: L4Activity[];
  allSkills: SkillWithContext[];
  knowledgeContext: KnowledgeContext;
  outputDir: string;
  batchConfig: OpenAiBatchConfig;
  topN?: number;
}

export interface TwoPassOpenAiBatchResult {
  scored: ScoringResult[];
  errors: string[];
  scoredCount: number;
  promotedCount: number;
  filterResult: FilterResult;
}

export async function runTwoPassScoringOpenAiBatch(
  args: TwoPassOpenAiBatchArgs,
): Promise<TwoPassOpenAiBatchResult> {
  const scored: ScoringResult[] = [];
  const errors: string[] = [];
  let scoredCount = 0;
  let promotedCount = 0;

  const topN = args.topN ?? 50;
  const filterResult = preScoreAll(args.hierarchy, topN);
  await writePreScoreTsv(args.outputDir, filterResult);

  const consolidatedKnowledgeContext =
    `Platform Capabilities:\n${args.knowledgeContext.capabilities}\n\n` +
    `UI Components:\n${args.knowledgeContext.components}\n\n` +
    `Process Builder Nodes:\n${args.knowledgeContext.processBuilder}`;

  const skillByL4 = new Map<string, SkillWithContext>();
  for (const skill of args.allSkills) {
    if (!skillByL4.has(skill.l4Name)) {
      skillByL4.set(skill.l4Name, skill);
    }
  }

  const requests = filterResult.survivors.flatMap((preScore) => {
    const skill = findSkillForPreScore(preScore, skillByL4, args.hierarchy);
    if (!skill) {
      return [];
    }

    const messages = buildConsolidatedPrompt(skill, consolidatedKnowledgeContext, preScore);
    return [{
      customId: preScore.l4Id,
      body: {
        model: args.batchConfig.scoringModel ?? "gpt-5-nano",
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "consolidated_lens_output",
            strict: true,
            schema: normalizeOpenAiJsonSchema(consolidatedJsonSchema),
          },
        },
      },
    }];
  });

  if (requests.length === 0) {
    return { scored, errors, scoredCount, promotedCount, filterResult };
  }

  const batchResult = await runOpenAiBatch(args.batchConfig, {
    jobName: "two-pass-scoring",
    endpoint: "/v1/chat/completions",
    outputDir: args.outputDir,
    requests,
  });

  const outputById = new Map<string, unknown>();
  for (const line of batchResult.outputLines) {
    const parsed = line as { custom_id?: string };
    if (parsed.custom_id) {
      outputById.set(parsed.custom_id, line);
    }
  }

  for (const preScore of filterResult.survivors) {
    const skill = findSkillForPreScore(preScore, skillByL4, args.hierarchy);
    if (!skill) {
      continue;
    }

    const rawLine = outputById.get(preScore.l4Id);
    if (!rawLine) {
      errors.push(`No batch output for ${preScore.l4Name} (${preScore.l4Id})`);
      continue;
    }

    const contentResult = extractChatCompletionContent(rawLine);
    if (!contentResult.success) {
      errors.push(`${preScore.l4Name}: ${contentResult.error}`);
      continue;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(contentResult.content);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${preScore.l4Name}: invalid JSON output (${message})`);
      continue;
    }

    const llmOutputResult = ConsolidatedLensSchema.safeParse(stripNullFields(parsedJson));
    if (!llmOutputResult.success) {
      errors.push(`${preScore.l4Name}: ${llmOutputResult.error.message}`);
      continue;
    }

    const llmOutput = llmOutputResult.data;
    const technical = buildTechnicalLensFromLLM(llmOutput);
    const adoption = buildAdoptionLensFromDeterministic(preScore);
    const value = buildValueLensFromDeterministic(preScore);
    const { composite, promotedToSimulation } = computeTwoPassComposite(
      preScore.composite,
      llmOutput.platform_fit.score / 3,
      llmOutput.sanity_verdict,
    );

    const result: ScoringResult = {
      skillId: skill.id,
      skillName: skill.name,
      l4Name: preScore.l4Name,
      l3Name: preScore.l3Name,
      l2Name: preScore.l2Name,
      l1Name: preScore.l1Name,
      archetype: skill.archetype,
      lenses: {
        technical,
        adoption,
        value,
      },
      composite,
      overallConfidence: llmOutput.confidence,
      promotedToSimulation,
      scoringDurationMs: 0,
      sanityVerdict: llmOutput.sanity_verdict,
      sanityJustification: llmOutput.sanity_justification,
      preScore: preScore.composite,
    };

    scored.push(result);
    scoredCount++;
    if (promotedToSimulation) {
      promotedCount++;
    }
  }

  return { scored, errors, scoredCount, promotedCount, filterResult };
}

async function writePreScoreTsv(
  outputDir: string,
  filterResult: FilterResult,
): Promise<void> {
  const evalDir = path.join(outputDir, "evaluation");
  await fs.mkdir(evalDir, { recursive: true });
  const allPreScores = [...filterResult.survivors, ...filterResult.eliminated];
  await fs.writeFile(path.join(evalDir, "pre-scores.tsv"), formatPreScoreTsv(allPreScores), "utf-8");
}

function findSkillForPreScore(
  preScore: PreScoreResult,
  skillByL4: Map<string, SkillWithContext>,
  hierarchy: L4Activity[],
): SkillWithContext | undefined {
  const existing = skillByL4.get(preScore.l4Name);
  if (existing) {
    return existing;
  }

  const l4 = hierarchy.find((candidate) => candidate.id === preScore.l4Id);
  if (!l4 || l4.skills.length === 0) {
    return undefined;
  }

  const rawSkill = l4.skills[0];
  return {
    ...rawSkill,
    execution: rawSkill.execution ?? {
      target_systems: [],
      write_back_actions: [],
      execution_trigger: null,
      execution_frequency: null,
      autonomy_level: null,
      approval_required: null,
      approval_threshold: null,
      rollback_strategy: null,
    },
    problem_statement: rawSkill.problem_statement ?? {
      current_state: "",
      quantified_pain: "",
      root_cause: "",
      falsifiability_check: "",
      outcome: "",
    },
    l4Name: l4.name,
    l4Id: l4.id,
    l3Name: l4.l3,
    l2Name: l4.l2,
    l1Name: l4.l1,
    financialRating: l4.financial_rating,
    aiSuitability: l4.ai_suitability,
    impactOrder: l4.impact_order,
    ratingConfidence: l4.rating_confidence,
    decisionExists: l4.decision_exists,
    decisionArticulation: l4.decision_articulation,
  };
}
