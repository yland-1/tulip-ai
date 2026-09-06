import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { HumanMessage } from '@langchain/core/messages';
import { tulipAIGraph } from './graph.js';
import './skillLoader.js'; // Ensure skills are loaded into context

const app = express();

// Enable CORS so the Lovable frontend can communicate without browser blocking
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'TulipAI Backend is running.', version: '1.0' });
});

/**
 * Main Chat Endpoint
 * Receives a prompt from the Lovable frontend, passes it to LangGraph,
 * and returns the updated AgentState JSON.
 */
app.post('/api/chat', async (req, res) => {
  const { prompt, stateContext } = req.body;
  
  if (!prompt && !stateContext) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // If the frontend passes back the previous state, we resume from it.
  // Otherwise, we initialize a fresh state.
  let inputState = stateContext || {
    messages: [],
    clientId: 'account_123',
    targetPlatforms: [],
    clarificationNeeded: false,
    clarificationQuestion: null,
    platformBudgets: {},
    humanApprovalStatus: 'NOT_REQUIRED',
    proposedBudgetShift: null
  };

  // Append the new user prompt
  if (prompt) {
    inputState.messages = [...(inputState.messages || []), new HumanMessage(prompt)];
  }

  try {
    console.log(`\n[API] Received chat prompt: "${prompt}"`);
    const finalState = await tulipAIGraph.invoke(inputState);
    res.json(finalState);
  } catch (error: any) {
    console.error('[API] Graph Execution Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approval Endpoint
 * Receives an APPROVED signal from the frontend dashboard, updating the state
 * and running the graph to execute the budget shift via the API.
 */
app.post('/api/approve', async (req, res) => {
  const { stateContext } = req.body;

  if (!stateContext || !stateContext.proposedBudgetShift) {
    return res.status(400).json({ error: 'Invalid stateContext or no pending budget shift found.' });
  }

  // Modify the state to indicate human approval
  const approvedState = {
    ...stateContext,
    humanApprovalStatus: 'APPROVED',
  };

  try {
    console.log(`\n[API] Processing approval for campaign shift: ${approvedState.proposedBudgetShift.campaignId}`);
    
    // Resume the graph. It will see humanApprovalStatus === 'APPROVED' and route to the executionNode
    const finalState = await tulipAIGraph.invoke(approvedState);
    res.json(finalState);
  } catch (error: any) {
    console.error('[API] Approval Execution Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 TulipAI Backend running at http://localhost:${PORT}`);
  console.log(`=============================================`);
});
