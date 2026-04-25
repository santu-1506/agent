/**
 * Backend Pipeline
 * Orchestrates the backend generation workflow
 */

import { messageBus } from '../utils/messageBus.js';
import BackendPlannerAgent from '../agents/backend/backendPlanner.js';
import SchemaAgent from '../agents/backend/schemaAgent.js';
import APIAgent from '../agents/backend/apiAgent.js';
import AuthAgent from '../agents/backend/authAgent.js';
import BackendIntegratorAgent from '../agents/backend/backendIntegrator.js';

export async function runBackendPipeline(specification, analysis) {
  console.log('[BackendPipeline] Starting backend generation pipeline');

  try {
    // Initialize and register backend agents
    const backendPlanner = new BackendPlannerAgent();
    const schemaAgent = new SchemaAgent();
    const apiAgent = new APIAgent();
    const authAgent = new AuthAgent();
    const backendIntegrator = new BackendIntegratorAgent();

    [backendPlanner, schemaAgent, apiAgent, authAgent, backendIntegrator].forEach(agent => {
      agent.registerWithMessageBus();
    });

    // Execute backend pipeline
    const backendResult = await messageBus.executeTask('backendPlanner', {
      specification,
      analysis
    }, 120000); // 2 minute timeout for full backend generation

    console.log('[BackendPipeline] Backend generation complete');

    return backendResult;
  } catch (error) {
    console.error('[BackendPipeline] Error:', error.message);
    throw error;
  }
}

export default runBackendPipeline;
