/**
 * Schema Agent
 * Generates database schemas and data models
 */

import BaseAgent from '../BaseAgent.js';
import { backendPrompts } from '../../prompts/backendPrompts.js';

export class SchemaAgent extends BaseAgent {
  constructor() {
    super('schemaAgent', 'SchemaAgent');
  }

  /**
   * Execute schema generation
   * @param {Object} taskData - Contains specification and architecture
   */
  async execute(taskData) {
    const { specification, architecture } = taskData;

    if (!specification || !architecture) {
      throw new Error('specification and architecture are required');
    }

    try {
      this.log('Generating database schema', 'info');

      const dbType = architecture?.schema_overview?.includes('MongoDB') ? 'mongodb' : 'postgresql';

      const schemaPrompt = backendPrompts.generateSchema(
        specification,
        architecture,
        dbType
      );

      const response = await this.callLLM(schemaPrompt, {
        taskType: 'code_generation',
        maxTokens: 6000
      });

      const result = this.publishResult({
        status: 'success',
        code: response.text,
        databaseType: dbType,
        fileName: dbType === 'mongodb' ? 'schema.js' : 'schema.sql'
      });

      return result;
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default SchemaAgent;
