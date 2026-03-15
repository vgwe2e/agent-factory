/**
 * Platform-fit re-scorer: deterministic pre-filter + semantic domain rules.
 *
 * Two-phase approach (Option A from first-principles analysis):
 * Phase 1: Keyword matching against capability keywords and use-case mappings
 * Phase 2: Semantic domain rules that capture Aera fit beyond literal keyword overlap
 *
 * Scoring rubric:
 *   0 = No match; outside Aera's domain (physical execution, MES/WMS/TMS territory)
 *   1 = Weak fit; partial overlap (Aera handles data/planning layer, not execution)
 *   2 = Moderate fit; maps to ≥2 specific Aera capabilities
 *   3 = Strong fit; core Aera use case with clear implementation pattern
 *
 * Patches feasibility-scores.tsv in place, recalculating tech_total and
 * weighted composite using the actual pipeline formula:
 *   composite = (tech/9 * 0.30) + (adoption/12 * 0.45) + (value/6 * 0.25)
 *   promotedToSimulation = composite >= 0.60
 */

import { readFileSync, writeFileSync } from 'node:fs';

// ── Load reference data ──────────────────────────────────────────────

const caps = JSON.parse(readFileSync('../data/capabilities/platform-capabilities.json', 'utf8'));
const mappings = JSON.parse(readFileSync('../data/capabilities/use-case-mappings.json', 'utf8'));
const tsv = readFileSync('../evaluation-vllm/evaluation/feasibility-scores.tsv', 'utf8');

// Flatten capabilities
const allCaps = caps.pillars.flatMap(p =>
  p.capabilities.map(c => ({
    name: c.name,
    pillar: p.name,
    keywords: c.keywords.map(k => k.toLowerCase()),
    bestFor: c.best_for.map(b => b.toLowerCase()),
  }))
);

// Flatten use-case mappings
const useCases = mappings.mappings.map(m => ({
  useCase: m.use_case.toLowerCase(),
  keywords: m.keywords.map(k => k.toLowerCase()),
  primary: m.primary_components,
}));

// ── Phase 1: Keyword matching ────────────────────────────────────────

function tokenize(name) {
  return name
    .toLowerCase()
    .replace(/[()&\/\-,]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !['and', 'for', 'the', 'with'].includes(t));
}

function keywordScore(oppName) {
  const tokens = tokenize(oppName);

  const useCaseHits = useCases.filter(uc => {
    const oppLower = oppName.toLowerCase();
    if (oppLower.includes(uc.useCase) || uc.useCase.includes(oppLower)) return true;
    const overlap = uc.keywords.filter(k => tokens.some(t => t.includes(k) || k.includes(t)));
    return overlap.length >= 2;
  });

  const capHits = allCaps.filter(c => {
    const kwOverlap = c.keywords.filter(k => tokens.some(t => t.includes(k) || k.includes(t)));
    const bfOverlap = c.bestFor.filter(bf => {
      const bfTokens = bf.split(/\s+/);
      return bfTokens.filter(bt => tokens.some(t => t.includes(bt) || bt.includes(t))).length >= 2;
    });
    return kwOverlap.length >= 2 || bfOverlap.length >= 1;
  });

  let score, reason;
  if (useCaseHits.length > 0 && capHits.length >= 2) {
    score = 3;
    reason = `Use-case+multi-cap: ${useCaseHits[0].useCase} → ${[...new Set(useCaseHits.flatMap(u => u.primary))].join(' + ')}`;
  } else if (useCaseHits.length > 0) {
    score = 2;
    reason = `Use-case: ${useCaseHits[0].useCase} → ${useCaseHits[0].primary.join(' + ')}`;
  } else if (capHits.length >= 2) {
    score = 2;
    reason = `Multi-cap: ${capHits.map(c => c.name).join(', ')}`;
  } else if (capHits.length === 1) {
    score = 1;
    reason = `Single cap: ${capHits[0].name}`;
  } else {
    score = 0;
    reason = 'No keyword match';
  }

  return { score, reason };
}

// ── Phase 2: Semantic domain rules ───────────────────────────────────

// Hard exclusions: physical execution, outside Aera's analytical domain
const ZERO_FIT = [
  /body.in.white|biw|assembly.*execution|battery.*(assembly|cell|module|pack)/i,
  /press.*operation|stamping.*supplier|die.*engineer/i,
  /powertrain.*assembly|drive.*unit.*(component|assembly|testing)/i,
  /topcoat|primer.*sealer|pre.treatment|e.coat|paint.*(shop|material|quality|product|process)/i,
  /vehicle.*assembly/i,
  /preventive.*mainten.*program|corrective.*mainten|breakdown.*manage/i,
  /plant.*mainten|equipment.*mainten|facilit.*mainten|asset.*lifecycle/i,
  /mainten.*(strategy|planning|parts|spares|workforce|asset)/i,
  /production.*line.*mainten/i,
  /receiving.*putaway|inbound.*receiving|order.*fulfil.*picking/i,
  /line.side.*material|raw.*material.*receipt.*kitting/i,
  /finished.*goods.*handling.*dispatch|outbound.*shipping.*loading/i,
  /vehicle.*distribut.*center/i,
  /mobile.*service.*deliv|field.*service.*engineer/i,
  /service.*tool.*equipment|technical.*service.*(inform|support|diagnos)/i,
  /diagnostic.*software.*firmware/i,
  /manufactur.*system.*(integrat|layout|it.*support)/i,
  /industrial.*engineer.*efficien/i,
  /packaging.*design.*specif/i,
  /sales.*channel.*market/i,
  /technology.*innovation.*scout/i,
  /emergency.*services.*integrat/i,
  /^environmental$/i,
  /environmental.*health.*safety/i,
];

const STRONG_FIT = [
  { pat: /demand.*(forecast|sens|signal|model)/i, reason: 'Core: Cortex Auto Forecast + STREAMS + Subject Areas' },
  { pat: /forecast.*(demand|sales)/i, reason: 'Core: Cortex Auto Forecast + STREAMS + Subject Areas' },
  { pat: /safety.stock/i, reason: 'Core: Safety Stock Service + STREAMS' },
  { pat: /inventory.*(optim|position|replenish)/i, reason: 'Core: Safety Stock Service + STREAMS + Subject Areas' },
  { pat: /exception.*(manage|resolution|escalat)/i, reason: 'Core: Exception Management + CWB Lifecycle + Process Builder' },
  { pat: /s&op|ibp/i, reason: 'Core: Subject Areas + Process Builder + UI Screens + Cortex Auto Forecast' },
];

const MODERATE_FIT = [
  { pat: /inventory.*(manage|strategy|policy|planning|risk|obsol|accuracy)/i, reason: 'Safety Stock Service + STREAMS' },
  { pat: /inventory.*exception/i, reason: 'Exception Management + Safety Stock Service' },
  { pat: /supply.*(plan|schedul)/i, reason: 'Process Builder + STREAMS' },
  { pat: /production.*(plan|schedul)/i, reason: 'Process Builder + STREAMS (batch planning)' },
  { pat: /master.production.schedul/i, reason: 'Process Builder + STREAMS + Cortex Auto Forecast' },
  { pat: /capacity.*(plan|scenario|assess)/i, reason: 'Cortex Auto Forecast + Subject Areas' },
  { pat: /statistic.*demand/i, reason: 'Cortex Auto Forecast + AutoML' },
  { pat: /demand.*collab/i, reason: 'CWB Lifecycle + Subject Areas + UI Screens' },
  { pat: /order.*(alloc|fulfil|receipt|valid|modif|cancel)/i, reason: 'Remote Functions + CWB Lifecycle' },
  { pat: /order.*production.*schedul/i, reason: 'Process Builder + STREAMS' },
  { pat: /constraint.*(ident|resolut|manage|exception)/i, reason: 'Exception Management + CWB Lifecycle' },
  { pat: /mrp|material.*requirement/i, reason: 'STREAMS + DDM/Crawlers + Remote Functions' },
  { pat: /cost.*(optim|value|analyt|recovery)/i, reason: 'Remote Functions + Subject Areas + AutoML' },
  { pat: /pricing.*(manage|exception|analyt)/i, reason: 'Remote Functions + CWB Lifecycle + STREAMS' },
  { pat: /data.*(integrat|management|analyt|technology|enablement)/i, reason: 'STREAMS + DDM/Crawlers + Subject Areas' },
  { pat: /financial.*(integrat|reconcil|analyt|profitab|manage|cost)/i, reason: 'Remote Functions + STREAMS + Subject Areas' },
  { pat: /new.*product.*intro.*(plan|forecast|inventor|capac|sourc|network)/i, reason: 'Process Builder + STREAMS' },
  { pat: /material.*(flow|require).*(plan|strateg)/i, reason: 'STREAMS + Subject Areas + Process Builder' },
  { pat: /network.*(design|optim|model|strateg)/i, reason: 'AutoML + Remote Functions + Subject Areas' },
  { pat: /supplier.*(perform|quality|capac|financ|risk|monitor|scor)/i, reason: 'STREAMS + RCA Service' },
  { pat: /claim.*(adjud|process|submis)/i, reason: 'Remote Functions + CWB Lifecycle + Process Builder' },
  { pat: /warranty.*(perform|cost|analyt|monitor)/i, reason: 'RCA Service + STREAMS + Subject Areas' },
  { pat: /compliance.*(track|manage|regulat|trade|planning)/i, reason: 'STREAMS + Remote Functions + Process Builder' },
  { pat: /risk.*(manage|scenario|plan|resilien)/i, reason: 'AutoML + Remote Functions + Subject Areas' },
  { pat: /purchase.*order|po.*(manage|lifecycle|creat|perform)/i, reason: 'Remote Functions + CWB Lifecycle + STREAMS' },
  { pat: /requisition.*order/i, reason: 'Remote Functions + CWB Lifecycle + Process Builder' },
  { pat: /commodity.*(analyt|report|strateg)/i, reason: 'Subject Areas + UI Screens + STREAMS' },
  { pat: /return.*reverse.*logist/i, reason: 'STREAMS + Remote Functions + Process Builder' },
  { pat: /indirect.*spend.*analyt/i, reason: 'Subject Areas + Remote Functions + UI Screens' },
  { pat: /logistics.*(perform|analyt)/i, reason: 'Subject Areas + UI Screens + STREAMS' },
  { pat: /quality.*(manage|control|assur|standard)/i, reason: 'RCA Service + STREAMS + CWB Lifecycle' },
  { pat: /non.conformance.*(manage|contain|rework)/i, reason: 'Exception Management + CWB Lifecycle + Process Builder' },
  { pat: /freight.*(plan|optim)/i, reason: 'AutoML + Remote Functions + STREAMS' },
  { pat: /transport.*(plan|strateg|optim|perform)/i, reason: 'AutoML + Remote Functions' },
  { pat: /warehouse.*(network|strateg|plan)/i, reason: 'AutoML + Remote Functions + Subject Areas' },
  { pat: /continuous.*improv.*(data|analyt|digital|process)/i, reason: 'RCA Service + Subject Areas + UI Screens' },
  { pat: /process.*(engineer|optim|valid|simul)/i, reason: 'AutoML + Remote Functions + Process Builder' },
  { pat: /performance.*(analyt|monitor|measur|report)/i, reason: 'UI Screens + Subject Areas + STREAMS' },
  { pat: /sourcing.*(strateg|categor|risk)/i, reason: 'Subject Areas + Remote Functions + AutoML' },
  { pat: /digital.*(transform|strateg|manufactur)/i, reason: 'Process Builder + STREAMS + Agentic AI' },
  { pat: /invoice.*(verif|process|payment)/i, reason: 'Remote Functions + CWB Lifecycle + STREAMS' },
  { pat: /recall.*fsa|fsa.*recall/i, reason: 'RCA Service + Process Builder + Remote Functions' },
  { pat: /procurement.*technol/i, reason: 'STREAMS + Remote Functions + Process Builder' },
];

const WEAK_FIT = [
  { pat: /warehouse.*(manage|inventory|perform|distribut)/i, reason: 'Partial: STREAMS for data, physical ops = WMS' },
  { pat: /inbound.*(logist|freight|transport)/i, reason: 'Partial: DDM/Crawlers for data, execution = TMS' },
  { pat: /outbound.*(logist|ship|vehicle)/i, reason: 'Partial: STREAMS for data, physical ops = TMS' },
  { pat: /supplier.*(relat|innovat|sustain|compli|ethic|divers|develop|collabor|communi|acknowledge)/i, reason: 'Partial: STREAMS for data, relationship mgmt = CRM' },
  { pat: /contract.*(manage|negoti|lifecycle|agree)/i, reason: 'Partial: Remote Functions + CWB, not a CLM system' },
  { pat: /launch.*(logist|program|risk|readiness)/i, reason: 'Partial: Process Builder for planning, execution is broader' },
  { pat: /new.*model.*launch/i, reason: 'Partial: Process Builder, physical readiness = MES' },
  { pat: /carrier.*(perform|relat|manage|sourc)/i, reason: 'Partial: STREAMS for data, carrier ops = TMS' },
  { pat: /material.*(handl|flow|internal)/i, reason: 'Partial: STREAMS for visibility, physical = WMS/MES' },
  { pat: /service.*parts.*(logist|warehous|outbound|inbound)/i, reason: 'Partial: STREAMS for data, physical = WMS/TMS' },
  { pat: /packag.*(manage|inventor|compli|cost|exception|sustain)/i, reason: 'Partial: STREAMS for tracking, not a packaging system' },
  { pat: /returnable.*(packag|container)/i, reason: 'Partial: STREAMS for tracking, physical = WMS' },
  { pat: /predict.*mainten|condition.*monitor/i, reason: 'Partial: AutoML for prediction, not IoT/CMMS' },
  { pat: /customer.*(order|request|issue|experience)/i, reason: 'Partial: CWB for workflow, customer service = CRM' },
  { pat: /dealer.*(order|claim|operation|service)/i, reason: 'Partial: Remote Functions for integration, dealer ops = DMS' },
  { pat: /emergency.*(parts|fulfil|escalat|manage)/i, reason: 'Partial: Exception Management for prioritization' },
  { pat: /supplier.*(qualif|onboard|ident|select|pre.qualif)/i, reason: 'Partial: STREAMS + Process Builder, not a SRM system' },
  { pat: /connect.*(service|vehicle)|ota.*software/i, reason: 'Partial: Agentic AI, not a connected car platform' },
  { pat: /in.transit.*visib/i, reason: 'Partial: STREAMS for aggregation, real-time = TMS' },
  { pat: /upfit/i, reason: 'Partial: Process Builder for workflow, physical outside Aera' },
  { pat: /market.*intellig|economic.*intellig|global.*market/i, reason: 'Partial: Subject Areas for storage, not a market data provider' },
  { pat: /workforce|labor.*skill/i, reason: 'Partial: Subject Areas for capacity data, not HCM' },
  { pat: /sustainab|green.*init|circular/i, reason: 'Partial: STREAMS for metrics, not a sustainability platform' },
  { pat: /commercial.*(change|dispute)/i, reason: 'Partial: CWB for workflow, disputes = legal/CLM' },
  { pat: /customs|trade.*compli/i, reason: 'Partial: Remote Functions, customs = GTM system' },
];

function score(oppName) {
  // Phase 1: keyword matching
  let { score: s, reason: r } = keywordScore(oppName);

  // Phase 2: semantic overrides (only upgrade, never downgrade phase 1)
  for (const pat of ZERO_FIT) {
    if (pat.test(oppName)) return { score: 0, reason: `Outside Aera: physical/execution` };
  }

  for (const rule of STRONG_FIT) {
    if (rule.pat.test(oppName) && 3 > s) { s = 3; r = rule.reason; break; }
  }
  if (s < 2) {
    for (const rule of MODERATE_FIT) {
      if (rule.pat.test(oppName) && 2 > s) { s = 2; r = rule.reason; break; }
    }
  }
  if (s === 0) {
    for (const rule of WEAK_FIT) {
      if (rule.pat.test(oppName)) { s = 1; r = rule.reason; break; }
    }
  }

  return { score: s, reason: r };
}

// ── Patch TSV ────────────────────────────────────────────────────────

// Weighted composite formula from src/scoring/composite.ts
const WEIGHTS = { technical: 0.30, adoption: 0.45, value: 0.25 };
const MAX = { technical: 9, adoption: 12, value: 6 };
const THRESHOLD = 0.60;

const lines = tsv.trim().split('\n');
const header = lines[0].split('\t');
const idx = {};
header.forEach((h, i) => idx[h] = i);

const results = [];
const newLines = [lines[0]];
let patched = 0;

for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split('\t');
  const oppName = cols[0];
  const { score: newPF, reason } = score(oppName);

  // Always recalculate tech_total and composite (fixes original bug too)
  const dr = parseInt(cols[idx.data_readiness]);
  const ac = parseInt(cols[idx.archetype_conf]);
  const techTotal = dr + newPF + ac;
  const adoptTotal = parseInt(cols[idx.adoption_total]);
  const valTotal = parseInt(cols[idx.value_total]);

  const composite =
    (techTotal / MAX.technical) * WEIGHTS.technical +
    (adoptTotal / MAX.adoption) * WEIGHTS.adoption +
    (valTotal / MAX.value) * WEIGHTS.value;

  const promoted = composite >= THRESHOLD ? 'Y' : 'N';
  const oldPromoted = cols[idx.promotes_to_sim];

  cols[idx.platform_fit] = String(newPF);
  cols[idx.tech_total] = String(techTotal);
  cols[idx.composite] = composite.toFixed(2);
  cols[idx.promotes_to_sim] = promoted;

  if (parseInt(cols[idx.platform_fit]) !== 0 || oldPromoted !== promoted) patched++;

  results.push({ name: oppName, pf: newPF, reason, composite: composite.toFixed(2), promoted, oldPromoted });
  newLines.push(cols.join('\t'));
}

writeFileSync('../evaluation-vllm/evaluation/feasibility-scores.tsv', newLines.join('\n') + '\n');

// ── Report ───────────────────────────────────────────────────────────

const pfDist = { 0: 0, 1: 0, 2: 0, 3: 0 };
results.forEach(r => pfDist[r.pf]++);

console.log('=== PLATFORM FIT DISTRIBUTION ===');
console.log(`  0 (no fit):   ${pfDist[0]} (${(pfDist[0]/results.length*100).toFixed(1)}%)`);
console.log(`  1 (weak):     ${pfDist[1]} (${(pfDist[1]/results.length*100).toFixed(1)}%)`);
console.log(`  2 (moderate): ${pfDist[2]} (${(pfDist[2]/results.length*100).toFixed(1)}%)`);
console.log(`  3 (strong):   ${pfDist[3]} (${(pfDist[3]/results.length*100).toFixed(1)}%)`);

const promoted = results.filter(r => r.promoted === 'Y');
const demoted = results.filter(r => r.oldPromoted === 'Y' && r.promoted === 'N');
const newlyPromoted = results.filter(r => r.oldPromoted === 'N' && r.promoted === 'Y');

console.log(`\n=== SIMULATION PROMOTION ===`);
console.log(`  Total promoted: ${promoted.length} / ${results.length}`);
console.log(`  Newly promoted (N→Y): ${newlyPromoted.length}`);
console.log(`  Demoted (Y→N): ${demoted.length}`);

if (newlyPromoted.length > 0) {
  console.log(`\n=== NEWLY PROMOTED TO SIMULATION ===`);
  newlyPromoted.forEach(r => console.log(`  ${r.composite} | pf=${r.pf} | ${r.name} — ${r.reason}`));
}

if (demoted.length > 0) {
  console.log(`\n=== DEMOTED FROM SIMULATION ===`);
  demoted.forEach(r => console.log(`  ${r.composite} | pf=${r.pf} | ${r.name} — ${r.reason}`));
}

// Write detailed results for audit
writeFileSync('./platform-fit-audit.json', JSON.stringify(results, null, 2));
console.log('\nWrote platform-fit-audit.json');
