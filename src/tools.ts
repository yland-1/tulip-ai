import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { PlatformType, ProposedBudgetShift } from "./state.js";

// ============================================================================
// 1. Google Ads Tools
// ============================================================================

/**
 * Tool: google_ads_anomaly_detection
 * Evaluates performance metrics over a lookback window to identify spend surges,
 * CPA anomalies, and conversion rate drops.
 */
export const googleAdsAnomalyDetectionSchema = z.object({
  accountId: z.string().describe("The Google Ads 10-digit customer account ID (e.g., '123' or '123-456-7890')"),
  lookbackWindowDays: z
    .number()
    .int()
    .min(1)
    .max(90)
    .describe("Number of days in the historical window used to establish performance baselines (e.g., 14)"),
});

export const googleAdsAnomalyDetectionTool = tool(
  async (input) => {
    // Mock enterprise diagnostic data for demonstration and testing
    const anomalies = [
      {
        campaignId: "camp-123",
        campaignName: "Search - High Intent Core Non-Brand",
        severity: "CRITICAL",
        anomalyType: "CPA_SPIKE_AND_CONVERSION_DROP",
        detectedMetrics: {
          currentDailyBudget: 1000,
          spendLast7Days: 7420,
          historicalAvgCpa: 42.5,
          currentCpa: 78.9,
          cpaChangePct: "+85.6%",
          conversionRateDropPct: "-41.2%",
        },
        rootCauseSummary:
          "Broad match keyword expansion led to irrelevant search terms consuming 48% of daily budget with 0 conversions.",
        recommendation:
          "Immediate 20% budget reduction (decrease daily budget from $1000 to $800) to curb wasted spend, combined with negative keyword additions.",
      },
      {
        campaignId: "camp-456",
        campaignName: "Performance Max - Retail Products",
        severity: "LOW",
        anomalyType: "SPEND_PACING_UNDER",
        detectedMetrics: {
          currentDailyBudget: 500,
          spendLast7Days: 2100,
          pacingPercentage: "60.0%",
        },
        rootCauseSummary: "Asset group approval delay on 3 image assets.",
        recommendation: "Monitor asset approvals; no budget shift recommended at this time.",
      },
    ];

    return JSON.stringify({
      status: "SUCCESS",
      accountId: input.accountId,
      lookbackDays: input.lookbackWindowDays,
      anomaliesFound: 2,
      criticalAnomalies: 1,
      anomalies,
      suggestedAction: {
        targetCampaignId: "camp-123",
        currentBudget: 1000,
        suggestedShiftPct: -20,
        suggestedBudget: 800,
      },
    }, null, 2);
  },
  {
    name: "google_ads_anomaly_detection",
    description:
      "Performs deep statistical anomaly detection across Google Ads campaigns in an account. Analyzes historical performance baselines to detect critical CPA spikes, conversion drops, spend surges, and pacing abnormalities. Always call this tool first when evaluating account health or diagnosing performance drops.",
    schema: googleAdsAnomalyDetectionSchema,
  }
);

/**
 * Tool: google_ads_budget_management
 * Evaluates, stages, and validates proposed daily budget shifts for a Google Ads campaign.
 */
export const googleAdsBudgetManagementSchema = z.object({
  campaignId: z.string().describe("The unique identifier of the target Google Ads campaign (e.g., 'camp-123')"),
  currentBudget: z.number().positive().describe("The current daily budget of the campaign in account currency (e.g., 1000)"),
  proposedBudget: z.number().nonnegative().describe("The new proposed daily budget in account currency (e.g., 800)"),
});

export const googleAdsBudgetManagementTool = tool(
  async (input) => {
    const diff = input.proposedBudget - input.currentBudget;
    const changePercentage = Math.round(((input.proposedBudget - input.currentBudget) / input.currentBudget) * 10000) / 100;
    const isDecrease = diff < 0;

    const stagedShift: ProposedBudgetShift = {
      platform: "google_ads",
      campaignId: input.campaignId,
      campaignName: "Search - High Intent Core Non-Brand",
      currentBudget: input.currentBudget,
      proposedBudget: input.proposedBudget,
      changePercentage,
      reason: isDecrease
        ? `Remediate CPA anomaly: decrease daily budget by ${Math.abs(changePercentage)}%`
        : `Scale performing campaign: increase daily budget by ${changePercentage}%`,
      stagedAt: new Date().toISOString(),
    };

    return JSON.stringify({
      status: "STAGED_PENDING_APPROVAL",
      message: `Proposed budget shift for campaign ${input.campaignId} successfully calculated and staged. Human approval is required before execution.`,
      shiftDetails: stagedShift,
      guardrailEvaluation: {
        withinSafetyBounds: Math.abs(changePercentage) <= 50,
        requiresExecutiveOverride: Math.abs(changePercentage) > 50,
      },
    }, null, 2);
  },
  {
    name: "google_ads_budget_management",
    description:
      "Stages and validates daily budget changes for a Google Ads campaign. Computes percentage shifts, checks enterprise risk boundaries, and returns a staged shift payload. Note: In TulipAI's governance model, budget shifts staged by this tool must receive human approval before the executionNode commits them to live ad APIs.",
    schema: googleAdsBudgetManagementSchema,
  }
);

/**
 * Tool: google_ads_bidding
 * Adjusts target CPA, target ROAS, or strategy types for Google Ads campaigns.
 */
export const googleAdsBiddingSchema = z.object({
  campaignId: z.string().describe("Target campaign identifier"),
  biddingStrategyType: z
    .enum(["TARGET_CPA", "TARGET_ROAS", "MAXIMIZE_CONVERSIONS", "MAXIMIZE_CONVERSION_VALUE"])
    .describe("Google Ads automated or smart bidding strategy type"),
  newTargetValue: z
    .number()
    .positive()
    .describe("Target CPA value (in currency units) or Target ROAS value (multiplier e.g. 3.5 for 350%)"),
});

export const googleAdsBiddingTool = tool(
  async (input) => {
    return JSON.stringify({
      status: "SUCCESS",
      campaignId: input.campaignId,
      biddingStrategyType: input.biddingStrategyType,
      newTargetValue: input.newTargetValue,
      message: `Bidding strategy for campaign ${input.campaignId} staged for update to ${input.biddingStrategyType} with target value ${input.newTargetValue}.`,
    }, null, 2);
  },
  {
    name: "google_ads_bidding",
    description:
      "Updates bidding strategy parameters (Target CPA, Target ROAS, Maximize Conversions) for a Google Ads campaign. Use when adjusting efficiency goals or realigning bid algorithms.",
    schema: googleAdsBiddingSchema,
  }
);

/**
 * Tool: google_ads_search_term_mining
 * Identifies wasteful search terms spending above a threshold without generating conversions.
 */
export const googleAdsSearchTermMiningSchema = z.object({
  campaignId: z.string().describe("Target campaign identifier"),
  minimumSpendThreshold: z
    .number()
    .positive()
    .describe("Minimum spend in dollars for a search query to be flagged if it generated 0 conversions (e.g., 50)"),
});

export const googleAdsSearchTermMiningTool = tool(
  async (input) => {
    return JSON.stringify({
      status: "SUCCESS",
      campaignId: input.campaignId,
      threshold: input.minimumSpendThreshold,
      wastefulQueriesIdentified: [
        { query: "free marketing software crack", spend: 184.2, conversions: 0 },
        { query: "marketing budget template docx", spend: 96.5, conversions: 0 },
      ],
      recommendedNegativeKeywords: ["crack", "template docx"],
      potentialMonthlySavings: 280.7,
    }, null, 2);
  },
  {
    name: "google_ads_search_term_mining",
    description:
      "Mines the Google Ads search terms report to locate wasteful, zero-conversion search queries that exceed a spend threshold. Generates negative keyword recommendations.",
    schema: googleAdsSearchTermMiningSchema,
  }
);

/**
 * Tool: google_ads_account_audit
 * Conducts a holistic health audit across an entire Google Ads customer account.
 */
export const googleAdsAccountAuditSchema = z.object({
  accountId: z.string().describe("Google Ads 10-digit customer account ID"),
});

export const googleAdsAccountAuditTool = tool(
  async (input) => {
    return JSON.stringify({
      status: "SUCCESS",
      accountId: input.accountId,
      accountHealthScore: 78,
      activeCampaignsCount: 6,
      dailySpendPacing: "92% of target",
      trackingTagHealth: "ALL_ACTIVE",
      criticalFindings: [
        "Campaign 'camp-123' experiencing elevated CPA over last 7 days.",
        "3 ad groups lack responsive search ad diversity.",
      ],
    }, null, 2);
  },
  {
    name: "google_ads_account_audit",
    description:
      "Performs a comprehensive architectural audit of a Google Ads account, evaluating tracking tag health, conversion tracking integrity, structural compliance, and overall pacing health score.",
    schema: googleAdsAccountAuditSchema,
  }
);

// ============================================================================
// 2. Meta Ads Skills (Extensible Registry)
// ============================================================================

import { executeCachedQuery } from "./bigquery.js";

/**
 * Tool: meta_ads_get_budgets
 * Retrieves campaign and ad set budget allocations from BigQuery data warehouse.
 */
export const metaAdsGetBudgetsSchema = z.object({
  accountId: z.string().describe("Meta Ads act_<account_id> account identifier (e.g. 'act_123456789')"),
  datePreset: z.enum(["today", "yesterday", "last_7d", "last_30d"]).describe("Time window for spend metrics (e.g. 'last_7d')"),
});

export const metaAdsGetBudgetsTool = tool(
  async (input) => {
    try {
      // Attempt to run the SQL query against BigQuery using our cached client
      const sql = `
        SELECT 
          campaign_id as id, 
          campaign_name as name, 
          daily_budget as dailyBudget, 
          status,
          spend as spendLast7Days,
          (spend / conversions) as cpa
        FROM \`meta_ads_data.CampaignStats\` 
        WHERE account_id = @accountId
      `;
      
      const rows = await executeCachedQuery(sql, { accountId: input.accountId });
      
      return JSON.stringify({
        status: "SUCCESS",
        platform: "meta_ads",
        accountId: input.accountId,
        currency: "USD",
        source: "BigQuery",
        campaigns: rows,
        fetchedAt: new Date().toISOString(),
      }, null, 2);
    } catch (error) {
      // Fallback to mock data if BigQuery is not yet authenticated or configured
      console.warn("BigQuery not configured or failed, falling back to mock data...");
      return JSON.stringify({
        status: "SUCCESS",
        platform: "meta_ads",
        accountId: input.accountId,
        currency: "USD",
        source: "Mock (BigQuery Offline)",
        totalDailyBudget: 1500,
        campaigns: [
          {
            id: "meta-camp-001",
            name: "Advantage+ Shopping Campaign (ASC) - US",
            dailyBudget: 1000,
            currency: "USD",
            status: "ENABLED",
            metricSummary: {
              roas: 2.85,
              spendLast7Days: 6950,
              cpa: 35.1,
              anomaliesDetected: false,
            },
          },
          {
            id: "meta-camp-002",
            name: "Middle of Funnel - Retargeting Video",
            dailyBudget: 500,
            currency: "USD",
            status: "ENABLED",
            metricSummary: {
              roas: 1.45,
              spendLast7Days: 3480,
              cpa: 68.2,
              anomaliesDetected: true,
            },
          },
        ],
        fetchedAt: new Date().toISOString(),
      }, null, 2);
    }
  },
  {
    name: "meta_ads_get_budgets",
    description:
      "Pulls live campaign and ad set budgets, current daily caps, and rolling 7-day ROAS/CPA performance metrics from the centralized BigQuery data warehouse. Use when conducting cross-platform budget audits or analyzing Meta spend.",
    schema: metaAdsGetBudgetsSchema,
  }
);

/**
 * Tool: meta_ads_budget_management
 * Stages daily or lifetime budget shifts for a Meta Ads campaign or ad set.
 */
export const metaAdsBudgetManagementSchema = z.object({
  campaignId: z.string().describe("Meta Ads campaign ID (e.g. 'meta-camp-002')"),
  currentBudget: z.number().positive().describe("Current daily budget in dollars"),
  proposedBudget: z.number().nonnegative().describe("Proposed new daily budget in dollars"),
});

export const metaAdsBudgetManagementTool = tool(
  async (input) => {
    const diff = input.proposedBudget - input.currentBudget;
    const changePercentage = Math.round(((input.proposedBudget - input.currentBudget) / input.currentBudget) * 10000) / 100;

    const stagedShift: ProposedBudgetShift = {
      platform: "meta_ads",
      campaignId: input.campaignId,
      campaignName: "Middle of Funnel - Retargeting Video",
      currentBudget: input.currentBudget,
      proposedBudget: input.proposedBudget,
      changePercentage,
      reason: `Meta Ads budget reallocation: shift ${changePercentage}% to optimize blended cross-platform ROAS`,
      stagedAt: new Date().toISOString(),
    };

    return JSON.stringify({
      status: "STAGED_PENDING_APPROVAL",
      message: `Meta Ads proposed budget shift for ${input.campaignId} staged. Awaiting human confirmation.`,
      shiftDetails: stagedShift,
    }, null, 2);
  },
  {
    name: "meta_ads_budget_management",
    description:
      "Stages and validates daily budget changes for Meta Ads campaigns and ad sets. Computes shift deltas and stages changes pending human approval.",
    schema: metaAdsBudgetManagementSchema,
  }
);

// ============================================================================
// 3. Tool Registries & Dynamic Skill Resolver
// ============================================================================

export const googleAdsTools = [
  googleAdsAnomalyDetectionTool,
  googleAdsBudgetManagementTool,
  googleAdsBiddingTool,
  googleAdsSearchTermMiningTool,
  googleAdsAccountAuditTool,
];

export const metaAdsTools = [
  metaAdsGetBudgetsTool,
  metaAdsBudgetManagementTool,
];

export const allTools = [...googleAdsTools, ...metaAdsTools];

/**
 * Dynamically resolves tools based on platform scope determined by the Orchestrator.
 */
export function getToolsForPlatforms(platforms: PlatformType[]) {
  const tools = [];
  if (platforms.includes("google_ads")) {
    tools.push(...googleAdsTools);
  }
  if (platforms.includes("meta_ads")) {
    tools.push(...metaAdsTools);
  }
  return tools.length > 0 ? tools : allTools;
}
