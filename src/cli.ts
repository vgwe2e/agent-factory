#!/usr/bin/env node

/**
 * Aera Skill Feasibility Engine -- CLI entry point.
 *
 * Usage: npx tsx cli.ts --input <path-to-hierarchy-export.json>
 */

import { Command } from "commander";
import { parseExport } from "./ingestion/parse-export.js";
import { checkOllama, formatOllamaStatus } from "./infra/ollama.js";

const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

const program = new Command();

program
  .name("aera-evaluate")
  .description(
    "Aera Skill Feasibility Engine -- evaluate hierarchy exports",
  )
  .requiredOption("--input <path>", "Path to hierarchy JSON export file")
  .action(async (opts: { input: string }) => {
    console.log(`${BOLD}Aera Skill Feasibility Engine v0.1.0${RESET}`);
    console.log(`Loading export: ${opts.input}...`);
    console.log();

    const result = await parseExport(opts.input);

    if (!result.success) {
      console.error(`${RED}Error: ${result.error}${RESET}`);
      process.exit(1);
    }

    const { meta, company_context, hierarchy, l3_opportunities } = result.data;

    // Format revenue
    const revenueStr =
      company_context.annual_revenue !== null
        ? "$" +
          new Intl.NumberFormat("en-US").format(company_context.annual_revenue)
        : "N/A";

    // Format employee count
    const employeeStr =
      company_context.employee_count !== null
        ? new Intl.NumberFormat("en-US").format(company_context.employee_count)
        : "N/A";

    // Get unique L1 domains from hierarchy
    const domains = [...new Set(hierarchy.map((h) => h.l1))].sort();

    console.log("=== Export Loaded ===");
    console.log(`Project:       ${meta.project_name}`);
    console.log(`Company:       ${company_context.company_name}`);
    console.log(`Industry:      ${company_context.industry}`);
    console.log(`Revenue:       ${revenueStr}`);
    console.log(`Employees:     ${employeeStr}`);
    console.log(
      `ERP Stack:     ${company_context.enterprise_applications.join(", ")}`,
    );
    console.log();
    console.log("=== Hierarchy ===");
    console.log(`L4 Activities: ${hierarchy.length}`);
    console.log(`L3 Opportunities: ${l3_opportunities.length}`);
    console.log(`Domains:       ${domains.join(", ")}`);
    console.log();

    // Ollama connectivity check (informational -- does not block)
    const ollamaStatus = await checkOllama();
    console.log("=== Ollama ===");
    console.log(formatOllamaStatus(ollamaStatus));
    console.log();

    console.log("=== Ready for Processing ===");

    process.exit(0);
  });

program.parse();
