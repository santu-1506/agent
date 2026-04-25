/**
 * Debug Agent
 * Handles errors and implements fixes
 */

import BaseAgent from '../BaseAgent.js';
import { sharedPrompts } from '../../prompts/sharedPrompts.js';

export class DebugAgent extends BaseAgent {
  constructor() {
    super('debugAgent', 'DebugAgent');
  }

  /**
   * Execute debugging and error correction
   * @param {Object} taskData - Contains issues, code, error, and context
   */
  async execute(taskData) {
    const { issues, code, error, context, recommendations } = taskData;

    if (!code && !error && !issues) {
      throw new Error('code, error, or issues are required');
    }

    try {
      this.log('Starting debug and error correction', 'info');

      let fixes = [];

      // Handle code with errors
      if (code && error) {
        this.log('Correcting code error', 'info');
        const correctPrompt = sharedPrompts.correctError(code, error, context);
        
        const correctResult = await this.callLLMStructured(
          correctPrompt,
          {
            type: 'object',
            properties: {
              root_cause: { type: 'string' },
              fixed_code: { type: 'string' },
              notes: { type: 'string' }
            }
          },
          { taskType: 'debugging' }
        );

        fixes.push({
          type: 'code_error',
          issue: error,
          fix: correctResult
        });
      }

      // Handle sync issues
      if (issues && Array.isArray(issues) && issues.length > 0) {
        this.log(`Handling ${issues.length} sync issues`, 'info');

        for (const issue of issues.slice(0, 3)) { // Limit to 3 issues per call
          try {
            const issueContext = `
Issue: ${issue}
Recommendations: ${recommendations ? JSON.stringify(recommendations) : 'none'}
`;
            const fixPrompt = sharedPrompts.correctError(code || '', issue, issueContext);
            
            const issueFixResult = await this.callLLMStructured(
              fixPrompt,
              {
                type: 'object',
                properties: {
                  root_cause: { type: 'string' },
                  fixed_code: { type: 'string' },
                  notes: { type: 'string' }
                }
              },
              { taskType: 'debugging' }
            );

            fixes.push({
              type: 'sync_issue',
              issue,
              fix: issueFixResult
            });
          } catch (err) {
            this.log(`Failed to fix issue ${issue}: ${err.message}`, 'warn');
          }
        }
      }

      const result = this.publishResult({
        status: 'success',
        fixesApplied: fixes.length,
        fixes,
        readyForIntegration: fixes.length > 0 && !fixes.some(f => f.fix?.notes?.includes('error'))
      });

      return result;
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default DebugAgent;
