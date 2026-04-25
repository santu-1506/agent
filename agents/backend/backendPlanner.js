/**
 * Backend Planner Agent
 * Plans backend architecture and orchestrates other backend agents
 */

import BaseAgent from '../BaseAgent.js';
import { backendPrompts } from '../../prompts/backendPrompts.js';

export class BackendPlannerAgent extends BaseAgent {
  constructor() {
    super('backendPlanner', 'BackendPlanner');
  }

  /**
   * Execute backend planning workflow
   * @param {Object} taskData - Contains specification and analysis
   */
  async execute(taskData) {
    const { specification, analysis } = taskData;

    if (!specification || !analysis) {
      throw new Error('specification and analysis are required');
    }

    try {
      this.log('Starting backend architecture planning', 'info');

      // Extract tech stack from analysis
      const techStack = analysis.tech_stack || {};

      // Step 1: Plan overall backend architecture
      const architecturePrompt = backendPrompts.planBackendArchitecture(
        specification,
        techStack
      );

      const architecture = await this.callLLMStructured(
        architecturePrompt,
        {
          type: 'object',
          properties: {
            schema_overview: { type: 'string' },
            api_structure: { type: 'object' },
            auth_strategy: { type: 'string' },
            middleware: { type: 'array' },
            integrations: { type: 'array' },
            scalability_notes: { type: 'string' }
          }
        },
        { taskType: 'architecture' }
      );

      this.log('Architecture plan complete', 'info');

      // Step 2: Delegate to specialized agents in parallel
      this.log('Delegating to schema, API, and auth agents', 'info');

      const [schemaResult, apiResult, authResult] = await Promise.all([
        this.requestHelp('schemaAgent', { specification, architecture }),
        this.requestHelp('apiAgent', { specification, architecture }),
        this.requestHelp('authAgent', { specification, architecture })
      ]);

      // Step 3: Integrate backend components
      this.log('Integrating backend components', 'info');
      const integratorResult = await this.requestHelp('backendIntegrator', {
        schema: schemaResult?.code,
        api: apiResult?.code,
        auth: authResult?.code,
        specification
      });

      const result = this.publishResult({
        status: 'success',
        architecture,
        schemaResult,
        apiResult,
        authResult,
        integratorResult,
        apiStructure: architecture.api_structure
      });

      return result;
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default BackendPlannerAgent;
