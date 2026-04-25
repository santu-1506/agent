/**
 * Frontend Integrator Agent
 * Validates and integrates frontend components
 */

import BaseAgent from '../BaseAgent.js';
import { frontendPrompts } from '../../prompts/frontendPrompts.js';

export class FrontendIntegratorAgent extends BaseAgent {
  constructor() {
    super('frontendIntegrator', 'FrontendIntegrator');
  }

  /**
   * Execute frontend integration and validation
   * @param {Object} taskData - Contains components, apiIntegration, styling, specification
   */
  async execute(taskData) {
    const { components, apiIntegration, styling, specification } = taskData;

    if (!components || !apiIntegration || !styling) {
      throw new Error('components, apiIntegration, and styling are required');
    }

    try {
      this.log('Validating frontend components', 'info');

      const validationPrompt = frontendPrompts.validateFrontend(
        components,
        apiIntegration,
        styling,
        specification
      );

      const validation = await this.callLLMStructured(
        validationPrompt,
        {
          type: 'object',
          properties: {
            components_complete: { type: 'boolean' },
            api_integration_valid: { type: 'boolean' },
            styling_complete: { type: 'boolean' },
            issues_found: { type: 'array' },
            fix_recommendations: { type: 'array' }
          }
        },
        { taskType: 'validation' }
      );

      // If issues found, log recommendations
      if (validation.issues_found && validation.issues_found.length > 0) {
        this.log(`Found ${validation.issues_found.length} issues`, 'warn');
        validation.fix_recommendations.forEach(rec => {
          this.log(`Recommendation: ${rec}`, 'info');
        });
      }

      const result = this.publishResult({
        status: 'success',
        validation,
        components,
        apiIntegration,
        styling,
        integrated: validation.components_complete && validation.api_integration_valid && validation.styling_complete
      });

      return result;
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default FrontendIntegratorAgent;
