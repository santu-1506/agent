/**
 * Test Agent
 * Generates and validates tests
 */

import BaseAgent from '../BaseAgent.js';
import { sharedPrompts } from '../../prompts/sharedPrompts.js';

export class TestAgent extends BaseAgent {
  constructor() {
    super('testAgent', 'TestAgent');
  }

  /**
   * Execute test generation
   * @param {Object} taskData - Contains code, language, and framework
   */
  async execute(taskData) {
    const { code, language = 'javascript', testFramework = 'jest' } = taskData;

    if (!code) {
      throw new Error('code is required');
    }

    try {
      this.log('Generating tests', 'info');

      const testPrompt = sharedPrompts.generateTests(code, language, testFramework);

      const response = await this.callLLM(testPrompt, {
        taskType: 'code_generation',
        maxTokens: 6000
      });

      this.log('Tests generated successfully', 'info');

      const result = this.publishResult({
        status: 'success',
        code: response.text,
        language,
        framework: testFramework,
        fileName: `${language === 'javascript' ? 'tests.js' : 'test_*.py'}`
      });

      return result;
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default TestAgent;
