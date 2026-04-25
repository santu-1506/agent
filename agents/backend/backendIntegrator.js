/**
 * Backend Integrator Agent
 * Validates and integrates backend components
 */

import BaseAgent from '../BaseAgent.js';
import { backendPrompts } from '../../prompts/backendPrompts.js';

export class BackendIntegratorAgent extends BaseAgent {
  constructor() {
    super('backendIntegrator', 'BackendIntegrator');
  }

  /**
   * Execute backend integration and validation
   * @param {Object} taskData - Contains schema, api, auth, specification
   */
  async execute(taskData) {
    const { schema, api, auth, specification } = taskData;

    if (!schema || !api || !auth) {
      throw new Error('schema, api, and auth are required');
    }

    try {
      this.log('Validating backend components', 'info');

      const validationPrompt = backendPrompts.validateBackend(
        schema,
        api,
        auth,
        specification
      );

      const validation = await this.callLLMStructured(
        validationPrompt,
        {
          type: 'object',
          properties: {
            schema_complete: { type: 'boolean' },
            api_complete: { type: 'boolean' },
            auth_complete: { type: 'boolean' },
            issues_found: { type: 'array' },
            fix_recommendations: { type: 'array' }
          }
        },
        { taskType: 'validation' }
      );

      // If issues found, attempt fixes
      let fixedSchema = schema;
      let fixedApi = api;
      let fixedAuth = auth;

      if (validation.issues_found && validation.issues_found.length > 0) {
        this.log(`Found ${validation.issues_found.length} issues, attempting fixes`, 'warn');

        // Debug agent would handle fixes in real scenario
        // For now, log recommendations
        validation.fix_recommendations.forEach(rec => {
          this.log(`Recommendation: ${rec}`, 'info');
        });
      }

      const result = this.publishResult({
        status: 'success',
        validation,
        schema: fixedSchema,
        api: fixedApi,
        auth: fixedAuth,
        integrated: validation.schema_complete && validation.api_complete && validation.auth_complete
      });

      return result;
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default BackendIntegratorAgent;
