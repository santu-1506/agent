/**
 * agents/manager/managerAgent.js
 *
 * The Manager Agent is the entry point for every build request.
 * It takes a plain-English user request and returns a structured
 * plan that backend and frontend pipelines consume.
 *
 * Flow:
 *   user input → Manager Agent → { backend_tasks, frontend_tasks, ... }
 *                             → posted to MessageBus as "manager"
 */

import { call }       from '../../utils/llm.js';
import messageBus    from '../../utils/messageBus.js';
import config        from '../../config/agentConfig.js';
import { managerPrompt, managerRepairPrompt } from '../../prompts/managerPrompts.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validate that the parsed plan has the minimum required shape.
 * Throws a descriptive error if anything is missing.
 */
function validatePlan(plan) {
  const required = ['feature_name', 'summary', 'backend_tasks', 'frontend_tasks'];
  for (const key of required) {
    if (!(key in plan)) {
      throw new Error(`Manager plan is missing required key: "${key}"`);
    }
  }
  if (!Array.isArray(plan.backend_tasks)) {
    throw new Error('"backend_tasks" must be an array');
  }
  if (!Array.isArray(plan.frontend_tasks)) {
    throw new Error('"frontend_tasks" must be an array');
  }
}

/**
 * Attempt to parse the LLM's JSON output, retrying with a repair prompt
 * if the first attempt fails.
 */
async function parseWithRetry(rawOutput, retriesLeft) {
  // Try clean parse first
  const cleaned = rawOutput
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    if (retriesLeft <= 0) {
      throw new Error(
        `Manager failed to return valid JSON after ${config.manager.maxRetries} retries.\nLast output:\n${rawOutput}`
      );
    }

    console.warn(`[ManagerAgent] JSON parse failed. Retrying repair (${retriesLeft} left)…`);

    const repaired = await call({
      system: managerPrompt,
      messages: [
        { role: 'user',      content: 'Decompose the feature.' },
        { role: 'assistant', content: rawOutput },
        { role: 'user',      content: managerRepairPrompt(rawOutput) },
      ],
    });

    return parseWithRetry(repaired, retriesLeft - 1);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

/**
 * handle(userRequest) → plan
 *
 * @param {string} userRequest - Plain English feature description
 *   e.g. "Build a login system with JWT and protected dashboard"
 *
 * @returns {Promise<{
 *   feature_name: string,
 *   summary: string,
 *   backend_tasks: Array<Task>,
 *   frontend_tasks: Array<Task>,
 *   shared_concerns: string[]
 * }>}
 */
async function handle(userRequest) {
  if (!userRequest || typeof userRequest !== 'string' || !userRequest.trim()) {
    throw new Error('ManagerAgent.handle() requires a non-empty string request.');
  }

  console.log(`\n[ManagerAgent] 🧠 Decomposing request: "${userRequest}"`);

  // ── Step 1: Call the LLM ──────────────────────────────────────────────────
  let rawOutput;
  try {
    rawOutput = await call({
      system: managerPrompt,
      messages: [{ role: 'user', content: userRequest }],
    });
  } catch (err) {
    throw new Error(`[ManagerAgent] LLM call failed: ${err.message}`);
  }

  // ── Step 2: Parse (with retry on bad JSON) ───────────────────────────────
  const plan = await parseWithRetry(rawOutput, config.manager.maxRetries);

  // ── Step 3: Validate shape ───────────────────────────────────────────────
  validatePlan(plan);

  // ── Step 4: Enrich with metadata ─────────────────────────────────────────
  const enrichedPlan = {
    ...plan,
    shared_concerns: plan.shared_concerns ?? [],
    meta: {
      created_at:    new Date().toISOString(),
      original_request: userRequest,
      task_counts: {
        backend:  plan.backend_tasks.length,
        frontend: plan.frontend_tasks.length,
      },
    },
  };

  // ── Step 5: Post to message bus ──────────────────────────────────────────
  bus.send('manager', enrichedPlan);

  console.log(`[ManagerAgent] ✅ Plan ready — ${enrichedPlan.meta.task_counts.backend} backend tasks, ${enrichedPlan.meta.task_counts.frontend} frontend tasks`);

  return enrichedPlan;
}

// Factory — app.js calls createManagerAgent() to get one clean instance
export function createManagerAgent() {
  return { handle };
}

export default { handle };