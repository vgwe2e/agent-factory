# Orchestration Decision Guide: Process Builder vs Agentic AI

## Quick Decision Framework

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION SELECTION                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Does the feature require LLM capabilities?                         │
│  ├── NO → Use Process Builder                                       │
│  │        (Deterministic, procedural, performance-critical)         │
│  │                                                                  │
│  └── YES → What kind of LLM capability?                             │
│            ├── Conversational interface → LLM Agent + Aera Chat     │
│            ├── Unstructured data → LLM Agent + Agent Functions      │
│            ├── Multi-step reasoning → Autonomous Agent              │
│            ├── Multi-agent collaboration → Agent Team               │
│            └── Wrap existing logic → Agent Function                 │
│                                                                     │
│  Can they work together?                                            │
│  └── YES → Process calls Agent Team OR Agent Function wraps Process │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Principle: Augmentation, Not Replacement

**Agentic AI does NOT replace Process Builder.**

It is a **WRAPPER + COORDINATOR** layer that adds LLM reasoning:

| Layer | Component | Purpose |
|-------|-----------|---------|
| **Orchestration** | Agent Teams | Coordinate multiple agents |
| **Reasoning** | Agents (LLM, Autonomous, Function) | LLM-powered decision making |
| **Wrapping** | Agent Functions | Add LLM reasoning to existing logic |
| **Execution** | Process Builder / Remote Functions | Execute procedural logic |

---

## Decision Matrix: When to Use What

### Use Process Builder WHEN:

| Scenario | Why Process Builder | Example |
|----------|---------------------|---------|
| **Deterministic workflows** | No LLM variability needed | ETL pipeline with fixed transformations |
| **Structured data transformations** | SQL-based processing | STREAMS → Subject Area loading |
| **Transaction control** | ACID compliance required | Financial data updates with rollback |
| **Scheduling & batch processing** | Time-based execution | Nightly forecast refresh |
| **Performance-critical operations** | No LLM latency overhead | High-volume data processing |
| **Rule-based decision logic** | IF/THEN deterministic rules | Approval thresholds |

### Use Agentic AI WHEN:

| Scenario | Why Agentic AI | Example |
|----------|----------------|---------|
| **Natural language interfaces** | User intent interpretation | Chat-based report requests |
| **Unstructured data processing** | LLM extraction/understanding | PDF invoice processing |
| **Adaptive reasoning** | Context-dependent decisions | Exception analysis |
| **Multi-agent collaboration** | Specialized expertise | Data → Analysis → Recommendation pipeline |
| **Conversational control** | Dialog-based workflow | Voice-activated inventory queries |
| **Minimal human oversight** | Autonomous decision-making | Self-healing data pipelines |

### Use BOTH (Hybrid) WHEN:

| Scenario | Integration Pattern | Example |
|----------|---------------------|---------|
| **LLM orchestrates procedural steps** | Agent Function wraps Process | Conversational ETL triggering |
| **Conversational control of workflows** | LLM Agent → Agent Function → Process | Chat-based report generation |
| **Process needs adaptive reasoning** | Process → Agent Team Node → Agents | CWB with exception analysis |
| **Agent results need persistence** | Agent → STREAMS | Compliance audit trail |
| **AI recommendations via chat** | Cortex → Agent Function → LLM Agent | Conversational forecasting |

---

## Scenario-Based Decision Guide

### Scenario 1: ETL Pipeline
```
Question: Building a data transformation pipeline
Answer: Process Builder

Why:
- Deterministic transformations
- SQL-based processing
- Scheduling required
- No LLM capabilities needed

Components: STREAMS → Process (Interface, Data View nodes) → Subject Area
```

### Scenario 2: Chat-Based Reporting
```
Question: Users want to request reports via natural language
Answer: Agentic AI (with Process Builder underneath)

Why:
- Natural language understanding required
- User intent interpretation
- Wrap existing report process with LLM

Components:
- LLM Agent (NL understanding)
- Agent Function (wraps Report Process)
- Process Builder (report generation)
- Aera Chat (user interface)
```

### Scenario 3: CWB Approval Workflow
```
Question: Standard recommendation accept/reject workflow
Answer: Process Builder

Why:
- Deterministic approval logic
- UI-driven workflow
- Transaction control needed
- No LLM reasoning required

Components: STREAMS (CWB lifecycle) → Process → UI Screen Node
```

### Scenario 4: CWB with Exception Analysis
```
Question: CWB needs intelligent exception analysis before approval
Answer: Hybrid (Process + Agent Team)

Why:
- Deterministic approval flow (Process)
- Adaptive reasoning for exceptions (Agent Team)
- Combine structured workflow with LLM analysis

Components:
- Process Builder (orchestrator)
- Agent Team Node (in process)
- LLM Agents (exception analysis)
- UI Screen Node (user interaction)
```

### Scenario 5: Invoice Processing from PDFs
```
Question: Extract invoice data from PDF documents
Answer: Agentic AI

Why:
- Unstructured data (PDFs)
- LLM extraction required
- Natural language understanding

Components:
- LLM Agent (PDF understanding)
- Agent Functions (extract, validate, load)
- STREAMS (persist extracted data)
```

### Scenario 6: Autonomous Compliance Checking
```
Question: System should independently audit and flag violations
Answer: Agentic AI (Autonomous Agent)

Why:
- Multi-step reasoning
- Independent decision-making
- Minimal human oversight
- Adaptive workflow

Components:
- Autonomous Agent (compliance checker)
- Agent Functions (audit, flag, report)
- Validation Controls (REQUIRED)
- STREAMS (audit trail)
```

### Scenario 7: Multi-Step Analysis Pipeline
```
Question: Data retrieval → Analysis → Recommendation workflow
Answer: Agentic AI (Agent Team)

Why:
- Multiple specialized steps
- Sequential or parallel execution
- Coordinated output

Components:
- Agent Team (Sequential or Custom)
- Function Agent (data retrieval)
- LLM Agent (analysis)
- LLM Agent (recommendation)
```

### Scenario 8: Performance-Critical Batch Processing
```
Question: High-volume nightly processing with strict SLAs
Answer: Process Builder

Why:
- Performance-critical (no LLM latency)
- Scheduling required
- Deterministic processing
- Transaction control

Components: Process → Asynchronous Node → Interface nodes → Transaction
```

---

## Component Selection Flowchart

### Step 1: Identify LLM Requirement

```
Does the feature need ANY of these?
├── Natural language understanding
├── Unstructured data processing (PDFs, emails, images)
├── Adaptive/context-dependent reasoning
├── Conversational interface
├── Multi-step autonomous decisions
└── Multi-agent collaboration

If YES to any → Consider Agentic AI
If NO to all → Use Process Builder
```

### Step 2: Select Agent Type (if Agentic AI)

```
What type of reasoning is needed?
├── Single-step NL understanding → LLM Agent
├── Multi-step independent tasks → Autonomous Agent (+ Validation Controls)
├── Execute predefined function → Function Agent
└── Coordinate multiple agents → Agent Team

What does the agent need to call?
├── Existing Process → Wrap with Agent Function
├── Existing Remote Function → Wrap with Agent Function
├── New Python logic → Create Remote Function, then Agent Function
└── Multiple functions → Multiple Agent Functions
```

### Step 3: Select Execution Mode (if Agent Team)

```
How do agents depend on each other?
├── Linear pipeline (A → B → C) → Sequential
├── Complex dependencies → Custom
├── Parallel with sync point → Custom
└── Conditional paths → Custom
```

### Step 4: Integration Pattern

```
How does Agentic AI integrate with existing components?
├── Wrap Process → Agent Function (object_type: Process)
├── Wrap Remote Function → Agent Function (object_type: Remote Function)
├── Call from Process → Agent Team Node in Process Builder
├── Data preparation → STREAMS upstream
├── Result persistence → STREAMS downstream
└── User interface → Aera Chat or UI Screen
```

---

## Recommended Architecture: Feature-Level Selection

**RECOMMENDED APPROACH**: Each feature independently selects its orchestration.

This mirrors the current component selection pattern and provides maximum flexibility.

### Example Skill with Mixed Orchestration

```yaml
skill_name: "Advanced Demand Planning"

features:
  - id: F1_demand_forecast
    name: "Demand Forecasting"
    category: AI_ML
    orchestration:
      type: none  # Pure Cortex service
      processes: []
      agents: []
    notes: "Cortex Auto Forecast, no orchestration needed"

  - id: F2_forecast_override
    name: "Forecast Override Workflow"
    category: Rule_Based
    orchestration:
      type: process
      processes:
        - name: "CWB_Override_Process"
          pattern: "Decision_Workflow"
      agents: []
    notes: "Standard CWB lifecycle, Process Builder only"

  - id: F3_exception_analysis
    name: "Exception Analysis"
    category: Hybrid
    orchestration:
      type: hybrid
      processes:
        - name: "Exception_Handler_Process"
          includes: "Agent Team Node"
      agents:
        - type: Agent_Team
          name: "Exception_Analysis_Team"
          execution_mode: Sequential
          members: ["Data_Retriever", "Exception_Analyzer", "Recommendation_Generator"]
    notes: "Process orchestrates Agent Team for adaptive analysis"

  - id: F4_conversational_query
    name: "Chat-Based Forecast Queries"
    category: Agentic_AI
    orchestration:
      type: agentic_ai
      processes:
        - name: "Forecast_Report_Process"
          wrapped_by: "Forecast_Query_Agent_Function"
      agents:
        - type: LLM_Agent
          name: "Forecast_Query_Agent"
          agent_functions: ["Forecast_Query_Agent_Function"]
    notes: "LLM Agent wraps existing report process for conversational access"
```

---

## Integration Patterns Reference

### Pattern 1: Agent Function Wraps Process
```
User Request → LLM Agent → Agent Function → Process → Result
                    ↑                            ↓
               Aera Chat                    STREAMS
```
**Use Case**: Conversational control of existing workflows

### Pattern 2: Process Calls Agent Team
```
Process Start → Nodes → Agent Team Node → Agent Team → Nodes → End
                              ↓
                    LLM Agents (reasoning)
```
**Use Case**: Structured workflow with adaptive reasoning step

### Pattern 3: Multi-Agent Pipeline
```
Input → Agent Team → [Agent 1 → Agent 2 → Agent 3] → Output
                          ↓         ↓         ↓
                    Agent Func  Agent Func  Agent Func
                          ↓         ↓         ↓
                      Process    Process   Remote Func
```
**Use Case**: Complex multi-step analysis requiring specialized agents

### Pattern 4: Autonomous Workflow
```
Trigger → Autonomous Agent → Agent Functions → Validation → Result
               ↑                    ↓               ↓
          Max Steps         Process/RF        STREAMS
          Planning          (wrapped)         (persist)
```
**Use Case**: Independent multi-step tasks with safety controls

---

## Validation Checklist

Before finalizing orchestration selection:

- [ ] **Process Builder features**: Are they truly deterministic with no LLM need?
- [ ] **Agentic AI features**: Do they require conversational/unstructured/adaptive capabilities?
- [ ] **Hybrid features**: Is the integration pattern clear (who calls whom)?
- [ ] **Agent Functions**: Do they wrap valid Process or Remote Function?
- [ ] **Autonomous Agents**: Are validation controls configured?
- [ ] **Agent Teams**: Is execution mode (Sequential/Custom) appropriate?
- [ ] **Integration**: Are STREAMS configured for upstream/downstream?
- [ ] **Testing**: Are example prompts defined for agent testing?

---

## Summary Table

| Requirement | Recommended | Components |
|-------------|-------------|------------|
| Deterministic ETL | Process Builder | STREAMS, Interface, Data View |
| Rule-based workflow | Process Builder | IF, While, Subprocess nodes |
| Transaction control | Process Builder | Transaction, Rollback nodes |
| Scheduling | Process Builder | Process Scheduling |
| Conversational interface | Agentic AI | LLM Agent, Aera Chat |
| Unstructured data | Agentic AI | LLM Agent, Agent Functions |
| Multi-step reasoning | Agentic AI | Autonomous Agent + Validation |
| Multi-agent collaboration | Agentic AI | Agent Team |
| LLM + procedural | Hybrid | Agent Function wraps Process |
| Process + adaptive | Hybrid | Process with Agent Team Node |

---

**Document Version**: 1.0
**Date**: 2025-12-09
**Related Files**:
- `agentic-ai-analysis.md` - Comprehensive analysis
- `agentic-ai-components.yaml` - Component taxonomy
- `.claude/agents/aera-agentic-ai-expert.md` - Expert agent
