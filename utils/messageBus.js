/**
 * utils/messageBus.js
 * Shared in-memory message bus for agent-to-agent communication.
 * Singleton — every module that imports this gets the same instance.
 *
 * Exports:
 *   messageBus         — the singleton bus instance
 *   getMessageBusLog() — returns full audit trail (used by app.js)
 */

class MessageBus {
  constructor() {
    /** @type {Map<string, any>} */
    this._store = new Map();

    /** @type {Array<{agent: string, timestamp: string, data: any}>} */
    this._log = [];
  }

  /**
   * Store data from an agent.
   * @param {string} agent - Agent name key (e.g. "manager", "schemaAgent")
   * @param {any}    data  - Any serialisable value
   */
  send(agent, data) {
    this._store.set(agent, data);
    this._log.push({ agent, timestamp: new Date().toISOString(), data });
  }

  /**
   * Read the latest data posted by an agent.
   * @param {string} agent
   * @returns {any | undefined}
   */
  receive(agent) {
    return this._store.get(agent);
  }

  /**
   * Check whether an agent has posted data.
   * @param {string} agent
   * @returns {boolean}
   */
  has(agent) {
    return this._store.has(agent);
  }

  /**
   * Return a full audit trail of all messages sent this session.
   */
  getLog() {
    return [...this._log];
  }

  /**
   * Clear all stored data (useful between test runs).
   */
  flush() {
    this._store.clear();
    this._log = [];
  }
}

// Singleton instance
export const messageBus = new MessageBus();

// Convenience export used by app.js for the final summary
export function getMessageBusLog() {
  return messageBus.getLog();
}

export default messageBus;