/**
 * app.js — Main entry point
 *
 * Orchestration order (matches architecture diagram exactly):
 *
 *   User Input
 *       ↓
 *   Manager Agent          → produces backend_tasks + frontend_tasks
 *       ↓
 *   Backend Pipeline  ──┐
 *   Frontend Pipeline ──┤  run in parallel
 *                       ↓
 *                   Sync Agent      → resolves mismatches
 *                       ↓
 *                   Debug Agent     → fixes bugs in generated code
 *                       ↓
 *                   Test Agent      → generates test cases
 *                       ↓
 *                   Final Output
 */

import 'dotenv/config';
import { createManagerAgent }   from './agents/manager/managerAgent.js';
import { createSyncAgent }      from './agents/shared/syncAgent.js';
import { createDebugAgent }     from './agents/shared/debugAgent.js';
import { createTestAgent }      from './agents/shared/testAgent.js';
import { runBackendPipeline }   from './pipelines/backendPipeline.js';
import { runFrontendPipeline }  from './pipelines/frontendPipeline.js';
import { getLLMStats }          from './utils/llm.js';
import { getMessageBusLog }     from './utils/messageBus.js';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEnv() {
  const provider = (process.env.LLM_PROVIDER ?? 'anthropic').toLowerCase();
  if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to your .env file.');
  }
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Add it to your .env file.');
  }
}

// ─── Logging helpers ──────────────────────────────────────────────────────────

function printHeader(title) {
  console.log('\n' + '═'.repeat(60));
  console.log(` ${title}`);
  console.log('═'.repeat(60));
}

function printSection(title) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 55 - title.length))}`);
}

function printPlanSummary(plan) {
  printSection('Plan Summary');
  console.log(`  Feature  : ${plan.feature_name}`);
  console.log(`  Summary  : ${plan.summary}`);
  console.log(`  Backend  : ${plan.meta.task_counts.backend} tasks`);
  console.log(`  Frontend : ${plan.meta.task_counts.frontend} tasks`);
  if (plan.shared_concerns?.length) {
    console.log(`  Concerns : ${plan.shared_concerns.join(', ')}`);
  }
}

function printAgentStats(agentResults) {
  printSection('Agent Stats');
  for (const [name, result] of Object.entries(agentResults)) {
    if (!result?.stats) continue;
    const { duration, tokenCount, status } = result.stats;
    const dStr = duration != null ? `${(duration / 1000).toFixed(2)}s` : 'n/a';
    const tStr = tokenCount != null ? tokenCount.toLocaleString() + ' tokens' : '';
    console.log(`  ${name.padEnd(22)} ${status ?? 'ok'}  ${dStr}  ${tStr}`);
  }
}

function printTokenUsage() {
  const stats = getLLMStats(); // { totalInputTokens, totalOutputTokens, totalTokens, callCount }
  if (!stats) return;
  printSection('Token Usage');
  console.log(`  Input    : ${stats.totalInputTokens.toLocaleString()}`);
  console.log(`  Output   : ${stats.totalOutputTokens.toLocaleString()}`);
  console.log(`  Total    : ${stats.totalTokens.toLocaleString()}`);
  console.log(`  LLM calls: ${stats.callCount}`);
}

function printFinalOutput(output) {
  printSection('Output');
  console.log(`  Status       : ${output.status}`);
  if (output.projectPath) {
    console.log(`  Project path : ${output.projectPath}`);
  }
}

// ─── Core orchestration ───────────────────────────────────────────────────────

/**
 * generateProduct(productSpec)
 *
 * @param {string} productSpec - Plain-English product description
 * @returns {Promise<object>}  - Full result including plan, code, tests
 */
export async function generateProduct(productSpec) {
  printHeader('AI Product Builder');

  validateEnv();

  const startTime = Date.now();

  // Instantiate agents — one each, no duplicates
  const manager = createManagerAgent();
  const sync    = createSyncAgent();
  const debug   = createDebugAgent();
  const tester  = createTestAgent();

  // Track per-agent results for stats printing
  const agentResults = {};

  // ── Step 1: Manager decomposes the request ──────────────────────────────
  console.log('\n[1/5] Manager Agent — decomposing request…');
  const plan = await manager.handle(productSpec);
  agentResults.manager = plan;
  printPlanSummary(plan);

  // ── Step 2: Backend + Frontend pipelines run in parallel ────────────────
  console.log('\n[2/5] Running Backend + Frontend pipelines in parallel…');
  const [backendOutput, frontendOutput] = await Promise.all([
    runBackendPipeline(plan.backend_tasks),
    runFrontendPipeline(plan.frontend_tasks),
  ]);
  agentResults.backendPipeline  = backendOutput;
  agentResults.frontendPipeline = frontendOutput;
  console.log('      ✓ Both pipelines complete');

  // ── Step 3: Sync Agent — resolve backend/frontend mismatches ────────────
  console.log('\n[3/5] Sync Agent — checking for mismatches…');
  const synced = await sync.handle({ backend: backendOutput, frontend: frontendOutput });
  agentResults.syncAgent = synced;

  // ── Step 4: Debug Agent — fix bugs in generated code ───────────────────
  console.log('\n[4/5] Debug Agent — scanning for bugs…');
  const debugged = await debug.handle(synced);
  agentResults.debugAgent = debugged;

  // ── Step 5: Test Agent — generate test cases ────────────────────────────
  console.log('\n[5/5] Test Agent — generating tests…');
  const tested = await tester.handle(debugged);
  agentResults.testAgent = tested;

  // ── Summary ─────────────────────────────────────────────────────────────
  const duration = (Date.now() - startTime) / 1000;

  printHeader(`Done in ${duration.toFixed(2)}s`);
  printFinalOutput(tested);
  printAgentStats(agentResults);
  printTokenUsage();

  return {
    plan,
    backend:  backendOutput,
    frontend: frontendOutput,
    synced,
    debugged,
    tested,
    meta: {
      duration,
      messageBusLog: getMessageBusLog(), // full audit trail of all agent messages
    },
  };
}

// ─── CLI entry ────────────────────────────────────────────────────────────────

async function main() {
  let productSpec = process.argv.slice(2).join(' ').trim();

  if (!productSpec) {
    productSpec = `
      Build a Todo application with:
      - User authentication (signup / login)
      - Create, read, update, delete todos
      - Mark todos as complete / incomplete
      - User dashboard showing their todos
      - Clean and simple UI
      - MongoDB + Express backend
      - React frontend
    `.trim();

    console.log('[App] No spec provided. Using default example.');
    console.log('[App] Usage: node app.js "Your product description here"\n');
  }

  await generateProduct(productSpec);
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});