/**
 * BaseAgent - Abstract base class for all agents
 * Provides common functionality for agent execution, logging, and communication
 */

import { messageBus } from '../utils/messageBus.js';
import { llm } from '../utils/llm.js';
import { agentConfig } from '../config/agentConfig.js';

export class BaseAgent {
  /**
   * Initialize base agent
   * @param {string} agentId - Unique agent identifier
   * @param {string} role - Agent role description
   */
  constructor(agentId, role) {
    this.agentId = agentId;
    this.role = role;
    this.config = agentConfig.agents[agentId] || { timeout: 30000, maxRetries: 2 };
    this.circuitBreaker = {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureCount: 0,
      successCount: 0,
      lastFailureTime: null
    };
    this.executionHistory = [];
  }

  /**
   * Main execution method - override in subclasses
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} Task result
   */
  async execute(taskData) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Register agent with message bus
   */
  registerWithMessageBus() {
    messageBus.subscribe(this.agentId, async (message) => {
      try {
        if (message.type === 'task') {
          const result = await this.execute(message.data);
          messageBus.sendResponse(message.requestId, result);
        }
      } catch (error) {
        messageBus.sendError(message.requestId, error);
      }
    });
    
    this.log(`Agent registered with message bus`, 'info');
  }

  /**
   * Request help from another agent
   * @param {string} otherAgentId - Agent to request help from
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} Response from other agent
   */
  async requestHelp(otherAgentId, taskData) {
    this.log(`Requesting help from ${otherAgentId}`, 'info');
    
    try {
      const response = await messageBus.executeTask(
        otherAgentId,
        taskData,
        this.config.timeout
      );
      return response;
    } catch (error) {
      this.log(`Help request failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Call LLM with circuit breaker and retry logic
   * @param {string} prompt - LLM prompt
   * @param {Object} options - LLM options
   * @returns {Promise<Object>} LLM response
   */
  async callLLM(prompt, options = {}) {
    // Check circuit breaker
    if (!this.isCircuitBreakerClosed()) {
      throw new Error(`Circuit breaker OPEN for ${this.agentId}`);
    }

    let lastError;
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        this.log(`LLM call (attempt ${attempt + 1}/${this.config.maxRetries})`, 'debug');
        
        const response = await llm.call(prompt, {
          ...options,
          model: agentConfig.selectModel(options.taskType || 'default')
        });

        // Success - reset circuit breaker
        this.updateCircuitBreaker(true);
        
        this.recordExecution({
          type: 'llm_call',
          status: 'success',
          tokensUsed: response.usage.inputTokens + response.usage.outputTokens,
          attempt
        });

        return response;
      } catch (error) {
        lastError = error;
        this.log(`LLM call failed: ${error.message}`, 'warn');

        // Wait before retry with exponential backoff
        if (attempt < this.config.maxRetries - 1) {
          const delay = agentConfig.getBackoffDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    this.updateCircuitBreaker(false);
    this.recordExecution({
      type: 'llm_call',
      status: 'failed',
      error: lastError.message
    });

    throw lastError;
  }

  /**
   * Call LLM with structured output (JSON)
   * @param {string} prompt - LLM prompt
   * @param {Object} schema - JSON schema
   * @param {Object} options - Options
   * @returns {Promise<Object>} Parsed JSON response
   */
  async callLLMStructured(prompt, schema, options = {}) {
    const response = await this.callLLM(prompt, {
      ...options,
      taskType: 'structured_output'
    });

    try {
      return JSON.parse(response.text);
    } catch {
      throw new Error(`Failed to parse structured output: ${response.text}`);
    }
  }

  /**
   * Publish execution result
   * @param {Object} result - Result data
   */
  publishResult(result) {
    const output = {
      agentId: this.agentId,
      timestamp: Date.now(),
      result
    };

    this.log(`Publishing result`, 'info');
    this.recordExecution({
      type: 'result_published',
      resultSize: JSON.stringify(result).length
    });

    return output;
  }

  /**
   * Check if circuit breaker is closed (operational)
   * @returns {boolean}
   */
  isCircuitBreakerClosed() {
    const config = agentConfig.circuitBreaker;
    const breaker = this.circuitBreaker;

    if (breaker.state === 'CLOSED') {
      return true;
    }

    if (breaker.state === 'OPEN') {
      // Check if timeout has passed
      if (Date.now() - breaker.lastFailureTime > config.timeout) {
        breaker.state = 'HALF_OPEN';
        breaker.successCount = 0;
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow one attempt
    return true;
  }

  /**
   * Update circuit breaker state
   * @param {boolean} success - Whether operation succeeded
   */
  updateCircuitBreaker(success) {
    const config = agentConfig.circuitBreaker;
    const breaker = this.circuitBreaker;

    if (success) {
      if (breaker.state === 'HALF_OPEN') {
        breaker.successCount++;
        if (breaker.successCount >= config.successThreshold) {
          breaker.state = 'CLOSED';
          breaker.failureCount = 0;
        }
      }
    } else {
      breaker.failureCount++;
      breaker.lastFailureTime = Date.now();

      if (breaker.failureCount >= config.failureThreshold) {
        breaker.state = 'OPEN';
      }
    }
  }

  /**
   * Log a message
   * @param {string} message - Log message
   * @param {string} level - Log level (debug, info, warn, error)
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.agentId}] [${level.toUpperCase()}] ${message}`;

    if (agentConfig.logging.level === 'debug' || level !== 'debug') {
      console.log(logMessage);
    }
  }

  /**
   * Record execution event for analytics
   * @param {Object} event - Event data
   */
  recordExecution(event) {
    this.executionHistory.push({
      timestamp: Date.now(),
      agentId: this.agentId,
      ...event
    });

    // Keep only last 100 events
    if (this.executionHistory.length > 100) {
      this.executionHistory.shift();
    }
  }

  /**
   * Get execution statistics
   * @returns {Object} Stats
   */
  getStats() {
    const successfulExecutions = this.executionHistory.filter(e => e.status === 'success').length;
    const failedExecutions = this.executionHistory.filter(e => e.status === 'failed').length;
    const totalTokens = this.executionHistory
      .filter(e => e.tokensUsed)
      .reduce((sum, e) => sum + e.tokensUsed, 0);

    return {
      agentId: this.agentId,
      role: this.role,
      successfulExecutions,
      failedExecutions,
      totalExecutions: this.executionHistory.length,
      totalTokensUsed: totalTokens,
      circuitBreakerState: this.circuitBreaker.state,
      recentEvents: this.executionHistory.slice(-5)
    };
  }

  /**
   * Clean up and shutdown agent
   */
  async shutdown() {
    this.log(`Shutting down agent`, 'info');
    // Override in subclasses if needed for cleanup
  }
}

export default BaseAgent;
