import { HumanMessage } from "@langchain/core/messages";
import { tulipAIGraph } from "./graph.js";
import { AgentState } from "./state.js";
import { getAvailableSkills, loadSkillContent } from "./skillLoader.js";

// Disable LangSmith tracing in standalone test runner to avoid unreachable socket warnings
process.env.LANGCHAIN_TRACING_V2 = "false";

function printDivider(title: string) {
  console.log("\n" + "=".repeat(80));
  console.log(`🔷  ${title}`);
  console.log("=".repeat(80));
}

function verifyDownloadedSkills() {
  printDivider("SKILL REGISTRY: Indexed Google Ads Skills");
  const skills = getAvailableSkills();
  console.log(`📦 Successfully indexed ${skills.length} Google Ads skills from repository:\n`);
  for (const [idx, s] of skills.entries()) {
    console.log(`  ${(idx + 1).toString().padStart(2, " ")}. [${s.name}]`);
    console.log(`      Path: ${s.path}`);
  }

  const sampleName = "google-ads-budget-management";
  const sampleSkill = loadSkillContent(sampleName);
  console.log(`\n📖 Verified Skill Playbook Loading ('${sampleName}'):`);
  console.log(`   Content length: ${sampleSkill?.length || 0} bytes. Found headings and formula guides.`);
}

async function runScenario1() {
  printDivider("SCENARIO 1: Google Ads Anomaly Detection & 20% Budget Shift Proposal");

  const initialInput = {
    messages: [
      new HumanMessage(
        "Run an anomaly detection on Account 123. If you find issues, propose a budget management shift decreasing the budget by 20%."
      ),
    ],
    clientId: "client_acme_corp",
  };

  console.log("📥 User Request:", initialInput.messages[0].content);
  console.log("⏳ Invoking TulipAI Multi-Agent Graph...\n");

  const result = await tulipAIGraph.invoke(initialInput);

  console.log("📊 Final Graph State Summary:");
  console.log(`- Target Platforms: [${result.targetPlatforms.join(", ")}]`);
  console.log(`- Clarification Needed: ${result.clarificationNeeded}`);
  console.log(`- Approval Status: ${result.humanApprovalStatus}`);
  console.log("- Proposed Budget Shift:", JSON.stringify(result.proposedBudgetShift, null, 2));

  console.log("\n📜 Agent Message Stream:");
  for (const [idx, msg] of result.messages.entries()) {
    const role = msg._getType();
    const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
    console.log(`\n[${idx + 1}] [${role.toUpperCase()}]:`);
    console.log(content);
    if ("tool_calls" in msg && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      console.log("🛠️  Tool Calls:", JSON.stringify(msg.tool_calls, null, 2));
    }
  }

  return result;
}

async function runScenario2(previousState: AgentState) {
  printDivider("SCENARIO 2: Human-in-the-Loop Approval & Execution");

  if (!previousState.proposedBudgetShift) {
    console.log("No budget shift staged from previous scenario.");
    return;
  }

  console.log("👤 Human Reviewer Decision: APPROVE proposed budget shift");
  console.log(`   Campaign: ${previousState.proposedBudgetShift.campaignId}`);
  console.log(`   Change: ${previousState.proposedBudgetShift.changePercentage}% ($${previousState.proposedBudgetShift.currentBudget} -> $${previousState.proposedBudgetShift.proposedBudget})\n`);

  // Resume graph with APPROVED status
  const approvedInput = {
    ...previousState,
    humanApprovalStatus: "APPROVED" as const,
    messages: [
      ...previousState.messages,
      new HumanMessage("I approve the staged 20% budget reduction for campaign camp-123. Please execute the shift."),
    ],
  };

  const executionResult = await tulipAIGraph.invoke(approvedInput);
  const lastMsg = executionResult.messages[executionResult.messages.length - 1];

  console.log("🚀 Execution Node Result Message:");
  console.log(lastMsg.content);
}

async function runScenario3() {
  printDivider("SCENARIO 3: Multi-Platform Skill Orchestration (Google Ads + Meta Ads)");

  const input = {
    messages: [
      new HumanMessage(
        "Run a full budget analysis across both Meta Ads and Google Ads for Account 123. Fetch the current budgets from both platforms and compare allocation."
      ),
    ],
    clientId: "client_omni_brand",
  };

  console.log("📥 User Request:", input.messages[0].content);
  console.log("⏳ Invoking TulipAI Multi-Agent Graph...\n");

  const result = await tulipAIGraph.invoke(input);

  console.log("📊 Orchestrator Plan:");
  console.log(JSON.stringify(result.orchestratorPlan, null, 2));
  console.log("\n📦 Aggregated Platform Budgets in State:");
  console.log(JSON.stringify(result.platformBudgets, null, 2));

  const lastMsg = result.messages[result.messages.length - 1];
  console.log("\n💬 Analyst Synthesis:");
  console.log(lastMsg.content);
}

async function runScenario4() {
  printDivider("SCENARIO 4: Ambiguous Request & Orchestrator Clarification Query");

  const input = {
    messages: [new HumanMessage("Optimize my ad budget.")],
    clientId: "client_ambiguous",
  };

  console.log("📥 Ambiguous Request:", input.messages[0].content);
  console.log("⏳ Invoking TulipAI Multi-Agent Graph...\n");

  const result = await tulipAIGraph.invoke(input);

  console.log(`❓ Clarification Needed Flag: ${result.clarificationNeeded}`);
  console.log("\n🤖 Orchestrator Clarification Question to User:");
  const lastMsg = result.messages[result.messages.length - 1];
  console.log(lastMsg.content);
}

async function main() {
  console.log("🌷 TulipAI - Multi-Agent Marketing Budget Orchestrator Test Suite");

  // Verify downloaded Google Ads skills
  verifyDownloadedSkills();

  // 1. Core user scenario: Google Ads anomaly detection & budget decrease proposal
  const scenario1State = await runScenario1();

  // 2. Human Approval & Execution of the staged shift
  await runScenario2(scenario1State as AgentState);

  // 3. Multi-platform skill orchestration (Google + Meta)
  await runScenario3();

  // 4. Ambiguity detection and clarifying questions
  await runScenario4();

  printDivider("ALL SCENARIOS COMPLETED SUCCESSFULLY");
}

main().catch((err) => {
  console.error("❌ Test execution failed:", err);
  process.exit(1);
});
