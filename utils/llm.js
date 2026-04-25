/**
 * utils/llm.js
 * Provider-agnostic LLM wrapper.
 * Switch providers via LLM_PROVIDER env variable: "anthropic" | "openai"
 *
 * Exports:
 *   call(params)     → Promise<string>
 *   callJSON(params) → Promise<object>
 *   getLLMStats()    → { totalInputTokens, totalOutputTokens, totalTokens, callCount }
 */

import config from '../config/agentConfig.js';

// ─── Token tracking ───────────────────────────────────────────────────────────

const _stats = {
  totalInputTokens:  0,
  totalOutputTokens: 0,
  totalTokens:       0,
  callCount:         0,
};

function _trackUsage(inputTokens = 0, outputTokens = 0) {
  _stats.totalInputTokens  += inputTokens;
  _stats.totalOutputTokens += outputTokens;
  _stats.totalTokens       += inputTokens + outputTokens;
  _stats.callCount         += 1;
}

export function getLLMStats() {
  return { ..._stats };
}

// ─── Adapters ─────────────────────────────────────────────────────────────────

async function callAnthropic({ system, messages, maxTokens, temperature }) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model:       config.llm.model.anthropic,
    max_tokens:  maxTokens    ?? config.llm.maxTokens,
    temperature: temperature  ?? config.llm.temperature,
    system,
    messages,
  });

  _trackUsage(response.usage?.input_tokens, response.usage?.output_tokens);
  return response.content[0].text;
}

async function callOpenAI({ system, messages, maxTokens, temperature }) {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model:       config.llm.model.openai,
    max_tokens:  maxTokens    ?? config.llm.maxTokens,
    temperature: temperature  ?? config.llm.temperature,
    messages: [{ role: 'system', content: system }, ...messages],
  });

  _trackUsage(
    response.usage?.prompt_tokens,
    response.usage?.completion_tokens,
  );
  return response.choices[0].message.content;
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * call({ system, messages, maxTokens?, temperature? }) → Promise<string>
 */
export async function call(params) {
  const provider = (process.env.LLM_PROVIDER ?? config.llm.provider).toLowerCase();

  if (provider === 'anthropic') return callAnthropic(params);
  if (provider === 'openai')    return callOpenAI(params);

  throw new Error(`Unknown LLM provider: "${provider}". Set LLM_PROVIDER to "anthropic" or "openai".`);
}

/**
 * callJSON({ system, messages, ... }) → Promise<object>
 * Same as call() but parses JSON and strips markdown fences.
 */
export async function callJSON(params) {
  const raw     = await call(params);
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`LLM returned invalid JSON.\nRaw response:\n${raw}\nParse error: ${err.message}`);
  }
}