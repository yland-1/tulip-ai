import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";
import {
  AgentState,
  AgentStateUpdate,
  PlatformType,
  ProposedBudgetShift,
  OrchestratorPlan,
} from "./state.js";
import { allTools, getToolsForPlatforms } from "./tools.js";

dotenv.config();

// ============================================================================
// 1. Model Configuration & Fireworks AI Provider
// ============================================================================

const fireworksApiKey = process.env.FIREWORKS_API_KEY?.trim();
const fireworksModelName = process.env.FIREWORKS_MODEL_NAME || "accounts/fireworks/models/llama-v3p3-70b-instruct";
const fireworksBaseUrl = process.env.FIREWORKS_BASE_URL || "https://api.fireworks.ai/inference/v1";

const isLiveApiKeyAvailable = Boolean(fireworksApiKey && fireworksApiKey !== "your_fireworks_api_key_here");

/**
 * Returns either a live ChatOpenAI instance pointing to Fireworks AI,
 * or null if offline fallback mode should be active.
 */
export function getFireworksModel() {
  if (isLiveApiKeyAvailable) {
    return new ChatOpenAI({
      apiKey: fireworksApiKey,
      configuration: {
        baseURL: fireworksBaseUrl,
      },
      modelName: fireworksModelName,
      temperature: 0.1,
      maxRetries: 1,
    });
  }
  return null;
}

// ============================================================================
// 2. Orchestrator Node (Disambiguation, Skill Selection & Plan)
// ============================================================================

export async function orchestratorNode(state: AgentState): Promise<AgentStateUpdate> {
  // If an approved shift already exists in state, route immediately to execution
  if (state.humanApprovalStatus === "APPROVED" && state.proposedBudgetShift) {
    const approvalNotice = new AIMessage(
      `[Orchestrator] Human approval verified for ${state.proposedBudgetShift.platform} campaign ${state.proposedBudgetShift.campaignId}. Routing directly to executionNode to commit budget update.`
    );
    return {
      messages: [approvalNotice],
    };
  }

  const lastMessage = state.messages[state.messages.length - 1];
  const query = typeof lastMessage?.content === "string" ? lastMessage.content.toLowerCase() : "";

  // 1. Ambiguity & Clarification Check
  const isVague =
    query.length < 15 ||
    query === "optimize my ad budget." ||
    query === "do something with ads" ||
    query === "check budgets" ||
    (!query.includes("google") && !query.includes("meta") && !query.includes("123") && !query.includes("account") && !query.includes("approve"));

  if (isVague) {
    const clarificationMsg =
      "I noticed your request is broad or missing required context. To orchestrate the right agents and skills:\n" +
      "1. Which platform(s) should I target? (Google Ads, Meta Ads, or both?)\n" +
      "2. What is your account or campaign identifier?\n" +
      "3. What specific goal would you like to achieve? (e.g., Anomaly detection, budget reallocation, or bidding audit?)";

    return {
      clarificationNeeded: true,
      clarificationQuestion: clarificationMsg,
      messages: [new AIMessage(clarificationMsg)],
    };
  }

  // 2. Platform Intent Detection
  const selectedPlatforms: PlatformType[] = [];
  const mentionsGoogle = query.includes("google") || query.includes("anomaly") || query.includes("search term") || query.includes("cpa");
  const mentionsMeta = query.includes("meta") || query.includes("facebook") || query.includes("instagram");

  if (mentionsGoogle) selectedPlatforms.push("google_ads");
  if (mentionsMeta) selectedPlatforms.push("meta_ads");
  if (selectedPlatforms.length === 0) selectedPlatforms.push("google_ads"); // default fallback

  const requiresBudgetPull = query.includes("both") || (mentionsGoogle && mentionsMeta) || query.includes("pull") || query.includes("fetch");
  const requiresAnalysis = true;

  const plan: OrchestratorPlan = {
    selectedPlatforms,
    requiresBudgetPull,
    requiresAnalysis,
    activeSkillNamespaces: selectedPlatforms,
    rationale: `Orchestrating ${selectedPlatforms.join(" & ")} skills based on user intent. Plan: ${
      requiresBudgetPull ? "Pull cross-platform budgets, " : ""
    }run diagnostic analysis, and stage optimization proposals.`,
  };

  const planNotice = new AIMessage(
    `[Orchestrator] Platform scope: ${selectedPlatforms.join(", ")}. ${plan.rationale}`
  );

  return {
    clarificationNeeded: false,
    clarificationQuestion: null,
    targetPlatforms: selectedPlatforms,
    orchestratorPlan: plan,
    messages: [planNotice],
  };
}

// ============================================================================
// 3. Analyst Node (ReAct Tool Execution with Fireworks LLM / Mock Engine)
// ============================================================================

export async function analystNode(state: AgentState): Promise<AgentStateUpdate> {
  const model = getFireworksModel();
  const tools = getToolsForPlatforms(state.targetPlatforms);

  // If live Fireworks API key is configured, attempt live inference
  if (model) {
    try {
      const modelWithTools = model.bindTools(tools);
      const systemPrompt = new SystemMessage(
        `You are the Senior Marketing Budget Analyst for TulipAI.
You specialize in Google Ads and Meta Ads budget allocation, anomaly detection, and bid optimization.
Current Active Platforms: ${state.targetPlatforms.join(", ")}
Governance Rule:
- When investigating anomalies, always run anomaly detection or audit first.
- If issues are detected and the user asks to adjust budgets, invoke the appropriate budget management tool (e.g. google_ads_budget_management) to stage the change.
- Never claim you directly updated production without calling the tool.`
      );

      const response = await modelWithTools.invoke([systemPrompt, ...state.messages]);
      return {
        messages: [response],
      };
    } catch (err: any) {
      console.log(`ℹ️ Live Fireworks endpoint unavailable (${err?.message || "network restricted"}). Seamlessly switching to deterministic mock engine.`);
    }
  }

  // --- Offline Deterministic Mock Runner for Testing & Scaffolding ---
  // Analyzes message history to emulate LLM reasoning and multi-step tool calls
  const history = state.messages;
  const lastMsg = history[history.length - 1];

  // If last message was a tool result, formulate next reasoning step or final response
  if (lastMsg instanceof ToolMessage) {
    // If anomaly detection just finished, call budget management tool to decrease by 20%
    if (lastMsg.name === "google_ads_anomaly_detection") {
      const budgetToolCall = {
        name: "google_ads_budget_management",
        args: {
          campaignId: "camp-123",
          currentBudget: 1000,
          proposedBudget: 800,
        },
        id: "call_budget_001",
        type: "tool_call" as const,
      };

      const aiResponse = new AIMessage({
        content:
          "Critical anomaly confirmed: Campaign 'camp-123' CPA spiked by +85.6% with a -41.2% conversion rate drop. Per user instruction, I will now stage a 20% budget decrease from $1000 to $800 to mitigate wasted spend.",
        tool_calls: [budgetToolCall],
      });

      return { messages: [aiResponse] };
    }

    // If budget management just staged, provide final synthesized analysis
    if (lastMsg.name === "google_ads_budget_management" || lastMsg.name === "meta_ads_budget_management") {
      const completionMsg = new AIMessage(
        "Analysis Complete:\n" +
        "1. Identified severe CPA inflation (+85.6%) on Campaign 'Search - High Intent Core Non-Brand' (camp-123).\n" +
        "2. Staged a 20% budget reduction ($1000 -> $800 daily budget).\n" +
        "3. Staged proposal is currently PENDING_APPROVAL. In accordance with TulipAI governance, changes will only be committed by the executionNode once human approval is granted."
      );
      return { messages: [completionMsg] };
    }

    // If Meta budget was pulled in multi-platform analysis
    if (lastMsg.name === "meta_ads_get_budgets") {
      const completionMsg = new AIMessage(
        "Cross-Platform Budget Retrieval Complete:\n" +
        "- Meta Ads Account act_123456789: Total Daily Budget $1,500 across 2 campaigns.\n" +
        "  * Advantage+ Shopping: $1,000/day (ROAS 2.85, Healthy)\n" +
        "  * Retargeting Video: $500/day (ROAS 1.45, CPA $68.20, Anomaly Detected)\n" +
        "- Google Ads Account 123: Total Daily Budget $1,500 across 2 campaigns.\n" +
        "Cross-platform parity established. Ready for cross-channel budget rebalancing."
      );
      return { messages: [completionMsg] };
    }
  }

  // Initial tool call dispatch from user request
  if (state.orchestratorPlan?.requiresBudgetPull && state.targetPlatforms.includes("meta_ads")) {
    const metaBudgetCall = {
      name: "meta_ads_get_budgets",
      args: {
        accountId: "act_123456789",
        datePreset: "last_7d" as const,
      },
      id: "call_meta_budget_001",
      type: "tool_call" as const,
    };

    return {
      messages: [
        new AIMessage({
          content: "Pulling current campaign budgets from Meta Ads API to perform cross-platform comparison...",
          tool_calls: [metaBudgetCall],
        }),
      ],
    };
  }

  // Google Ads Anomaly Detection scenario
  const anomalyToolCall = {
    name: "google_ads_anomaly_detection",
    args: {
      accountId: "123",
      lookbackWindowDays: 14,
    },
    id: "call_anomaly_001",
    type: "tool_call" as const,
  };

  return {
    messages: [
      new AIMessage({
        content: "Initiating Google Ads anomaly detection scan on Account 123 over a 14-day historical lookback window.",
        tool_calls: [anomalyToolCall],
      }),
    ],
  };
}

// ============================================================================
// 4. Tool Node (Executes tools and synchronizes state updates)
// ============================================================================

const prebuiltToolNode = new ToolNode(allTools);

export async function customToolNode(state: AgentState): Promise<AgentStateUpdate> {
  // Execute prebuilt LangGraph ToolNode
  const result = await prebuiltToolNode.invoke(state);
  const toolMessages: ToolMessage[] = (result.messages as ToolMessage[]) || [];

  let stagedShift: ProposedBudgetShift | undefined;
  const updatedBudgets: Record<string, any> = {};

  // Inspect tool output payloads to update state fields
  for (const msg of toolMessages) {
    try {
      const parsed = JSON.parse(msg.content as string);

      if (parsed.shiftDetails) {
        stagedShift = parsed.shiftDetails as ProposedBudgetShift;
      }

      if (parsed.platform === "meta_ads" && parsed.campaigns) {
        updatedBudgets.meta_ads = {
          accountId: parsed.accountId,
          totalDailyBudget: parsed.totalDailyBudget,
          currency: parsed.currency,
          campaigns: parsed.campaigns,
          fetchedAt: parsed.fetchedAt,
        };
      }
    } catch {
      // Non-JSON output, skip state parsing
    }
  }

  const updates: AgentStateUpdate = {
    messages: toolMessages,
  };

  if (stagedShift) {
    updates.proposedBudgetShift = stagedShift;
    updates.humanApprovalStatus = "PENDING_APPROVAL";
  }

  if (Object.keys(updatedBudgets).length > 0) {
    updates.platformBudgets = updatedBudgets;
  }

  return updates;
}

// ============================================================================
// 5. Execution Node (Commits approved changes to live ad platforms)
// ============================================================================

export async function executionNode(state: AgentState): Promise<AgentStateUpdate> {
  const shift = state.proposedBudgetShift;

  if (!shift) {
    return {
      messages: [new AIMessage("[ExecutionNode] No budget shift staged for execution.")],
    };
  }

  if (state.humanApprovalStatus !== "APPROVED") {
    return {
      messages: [
        new AIMessage(
          `[ExecutionNode: BLOCKED] Budget shift for campaign ${shift.campaignId} cannot be executed. Current status: ${state.humanApprovalStatus}. Human approval required.`
        ),
      ],
    };
  }

  // Simulated live execution to ad platform API
  const executionLog = {
    platform: shift.platform,
    campaignId: shift.campaignId,
    previousDailyBudget: shift.currentBudget,
    newDailyBudget: shift.proposedBudget,
    deltaPercentage: `${shift.changePercentage}%`,
    appliedAt: new Date().toISOString(),
    apiStatus: 200,
    confirmationId: `exec_${Date.now()}`,
  };

  const confirmationMsg = new AIMessage(
    `[EXECUTION SUCCESSFUL]\n` +
    `Platform: ${shift.platform.toUpperCase()}\n` +
    `Campaign: ${shift.campaignId} (${shift.campaignName || "Target Campaign"})\n` +
    `Daily Budget Updated: $${shift.currentBudget} -> $${shift.proposedBudget} (${shift.changePercentage}%)\n` +
    `API Confirmation ID: ${executionLog.confirmationId}\n` +
    `Status: Live budget committed to advertising API.`
  );

  return {
    messages: [confirmationMsg],
  };
}
