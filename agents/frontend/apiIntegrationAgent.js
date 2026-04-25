/**
 * API Integration Agent
 * Generates API service layer and integration
 */

import BaseAgent from '../BaseAgent.js';
import { frontendPrompts } from '../../prompts/frontendPrompts.js';

export class APIIntegrationAgent extends BaseAgent {
  constructor() {
    super('apiIntegrationAgent', 'APIIntegrationAgent');
  }

  /**
   * Execute API integration generation
   * @param {Object} taskData - Contains backendAPI and specification
   */
  async execute(taskData) {
    const { backendAPI, specification } = taskData;

    if (!specification) {
      throw new Error('specification is required');
    }

    try {
      this.log('Generating API integration layer', 'info');

      const apiPrompt = frontendPrompts.generateAPIIntegration(
        backendAPI || {},
        specification
      );

      const response = await this.callLLM(apiPrompt, {
        taskType: 'code_generation',
        maxTokens: 6000
      });

      const result = this.publishResult({
        status: 'success',
        code: response.text,
        endpointCount: Array.isArray(backendAPI?.endpoints) ? backendAPI.endpoints.length : 0,
        fileName: 'apiService.js'
      });

      return result;
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default APIIntegrationAgent;
