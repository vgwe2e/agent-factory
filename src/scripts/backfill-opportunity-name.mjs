/**
 * Backfill opportunity_name into existing TSVs by joining against the hierarchy export.
 * Writes v2 copies alongside the originals.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const exportPath = '../../.planning/ford_hierarchy_v3_export.json';
const triagePath = '../evaluation-vllm/evaluation/triage.tsv';
const scoresPath = '../evaluation-vllm/evaluation/feasibility-scores.tsv';

// Load opportunity name lookup from export
const exp = JSON.parse(readFileSync(exportPath, 'utf8'));
const oppNames = new Map();
for (const opp of exp.project.l3_opportunities) {
  oppNames.set(opp.l3_name, opp.opportunity_name ?? '');
}
console.log(`Loaded ${oppNames.size} opportunity names from export`);

// --- Patch triage TSV ---
const triage = readFileSync(triagePath, 'utf8');
const triageLines = triage.trim().split('\n');
const triageHeader = triageLines[0].split('\t');

// Insert opportunity_name after l3_name (index 4)
const l3Idx = triageHeader.indexOf('l3_name');
triageHeader.splice(l3Idx + 1, 0, 'opportunity_name');

const newTriageLines = [triageHeader.join('\t')];
for (let i = 1; i < triageLines.length; i++) {
  const cols = triageLines[i].split('\t');
  const l3Name = cols[l3Idx];
  cols.splice(l3Idx + 1, 0, oppNames.get(l3Name) ?? '');
  newTriageLines.push(cols.join('\t'));
}

const triageV2 = triagePath.replace('.tsv', '-v2.tsv');
writeFileSync(triageV2, newTriageLines.join('\n') + '\n');
console.log(`Wrote ${triageV2} (${newTriageLines.length - 1} rows)`);

// --- Patch feasibility-scores TSV ---
const scores = readFileSync(scoresPath, 'utf8');
const scoresLines = scores.trim().split('\n');
const scoresHeader = scoresLines[0].split('\t');

// Insert opportunity_name after l3_name (index 0)
const l3ScoreIdx = scoresHeader.indexOf('l3_name');
scoresHeader.splice(l3ScoreIdx + 1, 0, 'opportunity_name');

const newScoresLines = [scoresHeader.join('\t')];
let matched = 0;
for (let i = 1; i < scoresLines.length; i++) {
  const cols = scoresLines[i].split('\t');
  const l3Name = cols[l3ScoreIdx];
  const oppName = oppNames.get(l3Name) ?? '';
  if (oppName) matched++;
  cols.splice(l3ScoreIdx + 1, 0, oppName);
  newScoresLines.push(cols.join('\t'));
}

const scoresV2 = scoresPath.replace('.tsv', '-v2.tsv');
writeFileSync(scoresV2, newScoresLines.join('\n') + '\n');
console.log(`Wrote ${scoresV2} (${newScoresLines.length - 1} rows, ${matched} with opportunity names)`);
