/**
 * UI Planner Agent
 * Plans UI architecture and component hierarchy
 */

import BaseAgent from '../BaseAgent.js';
import { frontendPrompts } from '../../prompts/frontendPrompts.js';

export class UIPlannerAgent extends BaseAgent {
  constructor() {
    super('uiPlanner', 'UIPlan ner');
  }

  /**
   * Execute UI planning workflow
   * @param {Object} taskData - Contains specification, analysis, and backendAPI
   */
  async execute(taskData) {
    const { specification, analysis, backendAPI } = taskData;

    if (!specification || !analysis) {
      throw new Error('specification and analysis are required');
    }

    try {
      this.log('Starting UI architecture planning', 'info');

      // Step 1: Plan UI architecture
      const uiPrompt = frontendPrompts.planUIArchitecture(
        specification,
        backendAPI || {}
      );

      const uiArchitecture = await this.callLLMStructured(
        uiPrompt,
        {
          type: 'object',
          properties: {
            screens: { type: 'array' },
            component_hierarchy: { type: 'object' },
            navigation_flow: { type: 'string' },
            state_strategy: { type: 'string' },
            styling_approach: { type: 'string' },
            api_mapping: { type: 'object' },
            user_interactions: { type: 'array' }
          }
        },
        { taskType: 'architecture' }
      );

      this.log('UI architecture plan complete', 'info');

      // Step 2: Delegate to component, styling, and integration agents
      this.log('Delegating to component, styling, and API integration agents', 'info');

      const [componentResult, stylingResult, apiIntResult] = await Promise.all([
        this.requestHelp('componentAgent', { specification, uiArchitecture }),
        this.requestHelp('stylingAgent', { uiArchitecture, specification }),
        this.requestHelp('apiIntegrationAgent', { backendAPI, specification })
      ]);

      // Step 3: Integrate frontend components
      this.log('Integrating frontend components', 'info');
      const integratorResult = await this.requestHelp('frontendIntegrator', {
        components: componentResult?.code,
        apiIntegration: apiIntResult?.code,
        styling: stylingResult?.code,
        specification
      });

      const result = this.publishResult({
        status: 'success',
        uiArchitecture,
        componentResult,
        stylingResult,
        apiIntResult,
        integratorResult
      });

      return result;
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default UIPlannerAgent;
