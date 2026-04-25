/**
 * Component Agent
 * Generates React components
 */

import BaseAgent from '../BaseAgent.js';
import { frontendPrompts } from '../../prompts/frontendPrompts.js';

export class ComponentAgent extends BaseAgent {
  constructor() {
    super('componentAgent', 'ComponentAgent');
  }

  /**
   * Execute component generation
   * @param {Object} taskData - Contains specification and uiArchitecture
   */
  async execute(taskData) {
    const { specification, uiArchitecture } = taskData;

    if (!specification || !uiArchitecture) {
      throw new Error('specification and uiArchitecture are required');
    }

    try {
      this.log('Generating React components', 'info');

      const componentTypes = uiArchitecture.screens || ['MainScreen', 'FormScreen'];

      const componentPrompt = frontendPrompts.generateComponents(
        specification,
        uiArchitecture,
        componentTypes.join(', ')
      );

      const response = await this.callLLM(componentPrompt, {
        taskType: 'code_generation',
        maxTokens: 8000
      });

      const result = this.publishResult({
        status: 'success',
        code: response.text,
        componentCount: componentTypes.length,
        framework: 'react',
        fileName: 'components.jsx'
      });

      return result;
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default ComponentAgent;
