import { END, START, StateGraph } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import { AgentStateAnnotation, AgentState } from "./state.js";
import {
  orchestratorNode,
  analystNode,
  customToolNode,
  executionNode,
} from "./nodes.js";

// ============================================================================
// Conditional Routing Functions
// ============================================================================

/**
 * Evaluates whether the orchestrator flagged ambiguity, verified human approval,
 * or should proceed to diagnostic analysis.
 */
export function routeAfterOrchestrator(state: AgentState): "__end__" | "executionNode" | "analystNode" {
  if (state.clarificationNeeded) {
    return "__end__";
  }
  if (state.humanApprovalStatus === "APPROVED" && state.proposedBudgetShift) {
    return "executionNode";
  }
  return "analystNode";
}

/**
 * ReAct Tool Calling Loop & Human Approval Gate Router.
 * - If the analyst emitted tool_calls, route to toolNode.
 * - If analysis is complete and a budget shift is staged:
 *   - If APPROVED -> route to executionNode
 *   - If PENDING_APPROVAL -> route to END (awaiting human decision)
 * - Otherwise -> END
 */
export function routeAfterAnalyst(state: AgentState): "toolNode" | "executionNode" | "__end__" {
  const lastMessage = state.messages[state.messages.length - 1];

  // 1. Tool execution check (ReAct loop)
  if (lastMessage instanceof AIMessage && lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "toolNode";
  }

  // 2. Budget shift governance check
  if (state.proposedBudgetShift) {
    if (state.humanApprovalStatus === "APPROVED") {
      return "executionNode";
    }
    // Staged shift awaiting human approval - pause execution
    return "__end__";
  }

  // 3. Default termination
  return "__end__";
}

// ============================================================================
// StateGraph Assembly
// ============================================================================

export function buildTulipAIGraph() {
  const workflow = new StateGraph(AgentStateAnnotation)
    // Add nodes
    .addNode("orchestratorNode", orchestratorNode)
    .addNode("analystNode", analystNode)
    .addNode("toolNode", customToolNode)
    .addNode("executionNode", executionNode)

    // Wire Start & Orchestrator
    .addEdge(START, "orchestratorNode")
    .addConditionalEdges("orchestratorNode", routeAfterOrchestrator, {
      __end__: END,
      executionNode: "executionNode",
      analystNode: "analystNode",
    })

    // Wire Analyst conditional edges (ReAct loop + Approval gate)
    .addConditionalEdges("analystNode", routeAfterAnalyst, {
      toolNode: "toolNode",
      executionNode: "executionNode",
      __end__: END,
    })

    // ReAct loop: tool output feeds back into analyst
    .addEdge("toolNode", "analystNode")

    // Execution node finishes workflow
    .addEdge("executionNode", END);

  return workflow.compile();
}

export const tulipAIGraph = buildTulipAIGraph();
