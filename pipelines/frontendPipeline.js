/**
 * Frontend Pipeline
 * Orchestrates the frontend generation workflow
 */

import { messageBus } from '../utils/messageBus.js';
import UIPlannerAgent from '../agents/frontend/uiPlanner.js';
import ComponentAgent from '../agents/frontend/componentAgent.js';
import APIIntegrationAgent from '../agents/frontend/apiIntegrationAgent.js';
import StylingAgent from '../agents/frontend/stylingAgent.js';
import FrontendIntegratorAgent from '../agents/frontend/frontendIntegrator.js';

export async function runFrontendPipeline(specification, analysis, backendAPI) {
  console.log('[FrontendPipeline] Starting frontend generation pipeline');

  try {
    // Initialize and register frontend agents
    const uiPlanner = new UIPlannerAgent();
    const componentAgent = new ComponentAgent();
    const apiIntegrationAgent = new APIIntegrationAgent();
    const stylingAgent = new StylingAgent();
    const frontendIntegrator = new FrontendIntegratorAgent();

    [uiPlanner, componentAgent, apiIntegrationAgent, stylingAgent, frontendIntegrator].forEach(agent => {
      agent.registerWithMessageBus();
    });

    // Execute frontend pipeline
    const frontendResult = await messageBus.executeTask('uiPlanner', {
      specification,
      analysis,
      backendAPI
    }, 120000); // 2 minute timeout for full frontend generation

    console.log('[FrontendPipeline] Frontend generation complete');

    return frontendResult;
  } catch (error) {
    console.error('[FrontendPipeline] Error:', error.message);
    throw error;
  }
}

export default runFrontendPipeline;
