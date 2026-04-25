/**
 * Sync Agent
 * Synchronizes frontend/backend specifications and validates compatibility
 */

import BaseAgent from '../BaseAgent.js';
import { sharedPrompts } from '../../prompts/sharedPrompts.js';

export class SyncAgent extends BaseAgent {
  constructor() {
    super('syncAgent', 'SyncAgent');
  }

  /**
   * Execute synchronization between frontend and backend
   * @param {Object} taskData - Contains backendSpec, frontendSpec, specification
   */
  async execute(taskData) {
    const { backendSpec, frontendSpec, specification } = taskData;

    if (!backendSpec || !frontendSpec) {
      throw new Error('backendSpec and frontendSpec are required');
    }

    try {
      this.log('Synchronizing frontend/backend specifications', 'info');

      const syncPrompt = sharedPrompts.synchronizeComponents(
        backendSpec,
        frontendSpec
      );

      const syncResult = await this.callLLMStructured(
        syncPrompt,
        {
          type: 'object',
          properties: {
            contracts_match: { type: 'boolean' },
            schemas_compatible: { type: 'boolean' },
            auth_compatible: { type: 'boolean' },
            naming_consistent: { type: 'boolean' },
            issues_found: { type: 'array' },
            recommendations: { type: 'array' }
          }
        },
        { taskType: 'validation' }
      );

      // Log any issues found
      if (syncResult.issues_found && syncResult.issues_found.length > 0) {
        this.log(`Found ${syncResult.issues_found.length} sync issues`, 'warn');
        
        // Request debug agent help if needed
        if (syncResult.issues_found.length > 0) {
          this.log('Requesting debug agent assistance', 'info');
          try {
            const debugResult = await this.requestHelp('debugAgent', {
              issues: syncResult.issues_found,
              backendSpec,
              frontendSpec,
              recommendations: syncResult.recommendations
            });
            
            syncResult.debugResult = debugResult;
          } catch (err) {
            this.log(`Debug assistance failed: ${err.message}`, 'warn');
          }
        }
      }

      const result = this.publishResult({
        status: 'success',
        syncResult,
        isSynchronized: syncResult.contracts_match && syncResult.schemas_compatible
      });

      return result;
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default SyncAgent;
