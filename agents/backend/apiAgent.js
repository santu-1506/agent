/**
 * API Agent
 * Generates RESTful API endpoints and routing
 */

import BaseAgent from '../BaseAgent.js';
import { backendPrompts } from '../../prompts/backendPrompts.js';

export class APIAgent extends BaseAgent {
  constructor() {
    super('apiAgent', 'APIAgent');
  }

  /**
   * Execute API generation
   * @param {Object} taskData - Contains specification and architecture
   */
  async execute(taskData) {
    const { specification, architecture } = taskData;

    if (!specification || !architecture) {
      throw new Error('specification and architecture are required');
    }

    try {
      this.log('Generating API endpoints', 'info');

      const apiPrompt = backendPrompts.generateAPI(
        specification,
        architecture,
        'express'
      );

      const response = await this.callLLM(apiPrompt, {
        taskType: 'code_generation',
        maxTokens: 8000
      });

      const result = this.publishResult({
        status: 'success',
        code: response.text,
        framework: 'express',
        fileName: 'routes.js'
      });

      return result;
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default APIAgent;
