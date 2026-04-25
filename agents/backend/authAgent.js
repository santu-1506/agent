/**
 * Auth Agent
 * Generates authentication and authorization logic
 */

import BaseAgent from '../BaseAgent.js';
import { backendPrompts } from '../../prompts/backendPrompts.js';

export class AuthAgent extends BaseAgent {
  constructor() {
    super('authAgent', 'AuthAgent');
  }

  /**
   * Execute auth generation
   * @param {Object} taskData - Contains specification and architecture
   */
  async execute(taskData) {
    const { specification, architecture } = taskData;

    if (!specification || !architecture) {
      throw new Error('specification and architecture are required');
    }

    try {
      this.log('Generating authentication system', 'info');

      const authPrompt = backendPrompts.generateAuth(
        specification,
        architecture
      );

      const response = await this.callLLM(authPrompt, {
        taskType: 'code_generation',
        maxTokens: 5000
      });

      const result = this.publishResult({
        status: 'success',
        code: response.text,
        authMethod: architecture?.auth_strategy || 'jwt',
        fileName: 'auth.js'
      });

      return result;
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default AuthAgent;
