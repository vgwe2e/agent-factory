export function getSimulationPromptContext(input) {
    const opportunity = input.opportunity;
    const primaryL4 = input.l4Activity ?? input.l4s[0];
    return {
        subjectName: opportunity?.opportunity_name
            ?? opportunity?.l3_name
            ?? primaryL4?.name
            ?? "Unnamed opportunity",
        subjectSummary: opportunity?.opportunity_summary
            ?? opportunity?.rationale
            ?? primaryL4?.description
            ?? "No summary available",
        implementationComplexity: opportunity?.implementation_complexity ?? "MEDIUM",
    };
}
