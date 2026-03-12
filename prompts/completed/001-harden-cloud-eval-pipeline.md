<objective>
Create a new GSD milestone (v1.2) to harden the Aera Skill Feasibility Engine's cloud evaluation pipeline. This milestone addresses all the issues discovered during a 9-hour production run that should have taken 20 minutes.

Run `/gsd:new-milestone` with the context below to initialize the milestone, then proceed through the GSD workflow.
</objective>

<context>
The Aera engine (`src/`) evaluates Ford Motor Company hierarchy exports (362 L3 opportunities) across three scoring lenses using LLM inference. v1.1 added cloud-accelerated scoring via vLLM on RunPod GPUs. A production run on 2026-03-12 exposed critical issues across the entire cloud pipeline.

Read `CLAUDE.md` for project conventions and architecture.
Read `.planning/PROJECT.md` and `.planning/MILESTONES.md` for milestone history.
</context>

<milestone_definition>
<name>v1.2 — Cloud Pipeline Hardening</name>
<intent>Make the cloud evaluation pipeline reliable, automated, and fast enough to complete a full 362-opportunity Ford hierarchy evaluation in under 30 minutes on a single A100 GPU.</intent>

<problems_from_production>
These are real issues from a 2026-03-12 production run. Each must be addressed:

1. **RunPod provisioning failures (3 pods, 2 wasted)**
   - `runpodctl` uses `--gpu-id` not `--gpu-type` — no validation in our skill
   - `vllm/vllm-openai:latest` Docker image ignores `VLLM_ARGS` env var — must use `dockerArgs` via GraphQL API
   - First pod loaded wrong model (Qwen3-0.6B default instead of Qwen2.5-32B)
   - Second pod stuck in "Creating" for 15min with runtime=null — no timeout/fallback
   - Only third pod worked, using template + `dockerArgs`

2. **Simulation phase timeouts (~6 hours wasted)**
   - Simulation makes 4 heavy LLM calls per opportunity (decision flow, component map, mock test, integration surface)
   - At concurrency 3, GPU contention caused near-100% timeout rate on simulations
   - Even at concurrency 1, simulations timed out on most opportunities
   - 36 scoring errors from concurrency 3 required manual retry cycle
   - No `--skip-sim` flag exists to bypass simulation when only scores are needed

3. **Report generation bug**
   - Reports only reflect scores from the *current run*, not checkpoint data
   - When resuming, `allScoredResults[]` is empty for checkpointed items
   - Required a manual `regen-reports.ts` script to reconstruct from `.pipeline/checkpoint-*.json`

4. **No end-to-end automation**
   - Manual babysitting: run → check errors → clear checkpoint → retry → regen reports → teardown
   - Created `run-full-eval.sh` as a workaround but it's not integrated into the CLI
   - No automatic teardown on completion or failure

5. **No network volume reuse**
   - Every pod downloads ~60GB model from HuggingFace from scratch
   - Adds 5-15 minutes to cold start
   - Should persist model weights across runs

6. **Output directory conflicts**
   - Default `./evaluation` shared between local Ollama and cloud vLLM runs
   - Had to manually move to `./evaluation-vllm` to avoid clobbering
</problems_from_production>

<proposed_phases>
Suggested phase breakdown (GSD workflow will refine):

Phase 1: Fix report generation to include checkpoint data on resume
Phase 2: Add --skip-sim flag and simulation timeout configuration
Phase 3: Integrate retry loop and report regen into CLI (replace run-full-eval.sh)
Phase 4: Fix /setup-runpod-vllm skill — use GraphQL API, validate model loading, add timeout
Phase 5: Backend-aware output directories (auto-namespace by backend type)
Phase 6: Network volume support for model weight persistence
</proposed_phases>
</milestone_definition>

<success_criteria>
- Full 362-opportunity Ford evaluation completes in under 30 minutes on A100
- Zero manual intervention needed: one command handles score + retry + report + teardown
- Reports always reflect full checkpoint data, even on resume
- RunPod provisioning succeeds on first attempt with correct model
- Simulation phase can be skipped or configured with custom timeouts
- Local and cloud runs never clobber each other's output
</success_criteria>
