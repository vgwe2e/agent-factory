export function assessSimulation({ scenarioSpec, mockTest, integrationSurface, confirmedCount, inferredCount, mermaidValid, }) {
    const totalKnowledgeRefs = confirmedCount + inferredCount;
    const groundednessScore = totalKnowledgeRefs > 0
        ? toPercent(confirmedCount / totalKnowledgeRefs)
        : 0;
    const sourceSystems = scenarioSpec?.source_systems.length
        ? scenarioSpec.source_systems
        : integrationSurface.source_systems;
    const totalSourceSystems = sourceSystems.length;
    const identifiedSystems = sourceSystems.filter((system) => system.status === "identified").length;
    const tbdSystems = sourceSystems.filter((system) => system.status === "tbd").length;
    const integrationSignals = [
        totalSourceSystems > 0 ? identifiedSystems / totalSourceSystems : 0,
        integrationSurface.aera_ingestion.length > 0 ? 1 : 0,
        integrationSurface.processing.length > 0 ? 1 : 0,
        integrationSurface.ui_surface.length > 0 ? 1 : 0,
        (scenarioSpec?.key_inputs.length ?? 0) > 0 ? 1 : 0,
    ];
    const integrationConfidenceScore = toPercent(average(integrationSignals));
    const inferredRatio = totalKnowledgeRefs > 0 ? inferredCount / totalKnowledgeRefs : 1;
    const tbdRatio = totalSourceSystems > 0 ? tbdSystems / totalSourceSystems : 1;
    const ambiguityRiskScore = toPercent(clamp01((inferredRatio * 0.5) +
        (tbdRatio * 0.3) +
        (mermaidValid ? 0 : 0.2)));
    const actionabilitySignals = [
        scenarioSpec?.decision ? 1 : 0,
        scenarioSpec?.expected_action ? 1 : 0,
        scenarioSpec?.expected_outcome ? 1 : 0,
        mockTest.decision ? 1 : 0,
        mockTest.expected_output.action ? 1 : 0,
    ];
    const actionabilityScore = toPercent(average(actionabilitySignals));
    const implementationReadinessScore = clampScore(Math.round((groundednessScore * 0.4) +
        (integrationConfidenceScore * 0.35) +
        (actionabilityScore * 0.15) +
        ((mermaidValid ? 100 : 40) * 0.1) -
        (ambiguityRiskScore * 0.1)));
    const verdict = decideVerdict({
        groundednessScore,
        integrationConfidenceScore,
        ambiguityRiskScore,
        implementationReadinessScore,
    });
    const reasons = buildReasons({
        verdict,
        groundednessScore,
        integrationConfidenceScore,
        ambiguityRiskScore,
        mermaidValid,
        identifiedSystems,
        totalSourceSystems,
    });
    return {
        groundednessScore,
        integrationConfidenceScore,
        ambiguityRiskScore,
        implementationReadinessScore,
        verdict,
        reasons,
    };
}
export function countAssessmentVerdicts(assessments) {
    const counts = {
        ADVANCE: 0,
        REVIEW: 0,
        HOLD: 0,
    };
    for (const assessment of assessments) {
        if (!assessment)
            continue;
        counts[assessment.verdict] += 1;
    }
    return counts;
}
function decideVerdict(scores) {
    if (scores.implementationReadinessScore >= 70 &&
        scores.groundednessScore >= 50 &&
        scores.integrationConfidenceScore >= 60 &&
        scores.ambiguityRiskScore <= 40) {
        return "ADVANCE";
    }
    if (scores.implementationReadinessScore >= 45 &&
        scores.groundednessScore >= 25 &&
        scores.integrationConfidenceScore >= 30 &&
        scores.ambiguityRiskScore <= 75) {
        return "REVIEW";
    }
    return "HOLD";
}
function buildReasons({ verdict, groundednessScore, integrationConfidenceScore, ambiguityRiskScore, mermaidValid, identifiedSystems, totalSourceSystems, }) {
    const reasons = [];
    if (groundednessScore < 50) {
        reasons.push(`Low groundedness (${groundednessScore}) from confirmed vs inferred component references.`);
    }
    if (integrationConfidenceScore < 60) {
        reasons.push(`Integration confidence is limited (${integrationConfidenceScore}) due to sparse identified systems or surface detail.`);
    }
    if (ambiguityRiskScore > 60) {
        reasons.push(`Ambiguity risk is elevated (${ambiguityRiskScore}) due to inferred components or TBD systems.`);
    }
    if (!mermaidValid) {
        reasons.push("Decision flow failed Mermaid validation.");
    }
    if (identifiedSystems === 0 || totalSourceSystems === 0) {
        reasons.push("No identified source systems were grounded in the scenario.");
    }
    if (reasons.length === 0) {
        if (verdict === "ADVANCE") {
            reasons.push("Scenario is grounded, integration-aware, and implementation-ready.");
        }
        else if (verdict === "REVIEW") {
            reasons.push("Scenario is plausible but still needs design review before commitment.");
        }
        else {
            reasons.push("Scenario needs substantial clarification before implementation.");
        }
    }
    return reasons;
}
function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function toPercent(value) {
    return clampScore(Math.round(clamp01(value) * 100));
}
function clamp01(value) {
    return Math.min(1, Math.max(0, value));
}
function clampScore(value) {
    return Math.min(100, Math.max(0, value));
}
