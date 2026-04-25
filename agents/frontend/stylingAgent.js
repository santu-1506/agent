/**
 * Styling Agent
 * Generates CSS and styling
 */

import BaseAgent from '../BaseAgent.js';
import { frontendPrompts } from '../../prompts/frontendPrompts.js';

export class StylingAgent extends BaseAgent {
  constructor() {
    super('stylingAgent', 'StylingAgent');
  }

  /**
   * Execute styling generation
   * @param {Object} taskData - Contains uiArchitecture and specification
   */
  async execute(taskData) {
    const { uiArchitecture, specification } = taskData;

    if (!uiArchitecture || !specification) {
      throw new Error('uiArchitecture and specification are required');
    }

    try {
      this.log('Generating styling', 'info');

      const stylingPrompt = frontendPrompts.generateStyling(
        uiArchitecture,
        specification
      );

      const response = await this.callLLM(stylingPrompt, {
        taskType: 'code_generation',
        maxTokens: 5000
      });

      const result = this.publishResult({
        status: 'success',
        code: response.text,
        approach: uiArchitecture.styling_approach || 'tailwind',
        fileName: 'styles.css'
      });

      return result;
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default StylingAgent;
