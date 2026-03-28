/**
 * Model configuration for the Bible Study AI agent.
 *
 * Temperature 0.3 — accurate theological responses.
 * Models chosen from top 5 providers (March 2026, latest flagships).
 */

/** Default model — best balance of quality, speed, and cost */
export const DEFAULT_MODEL = "anthropic/claude-opus-4.6";

/** Temperature for Bible study — low for theological accuracy, slight warmth for readability */
export const DEFAULT_TEMPERATURE = 0.3;

/**
 * Supported models across 5 top providers.
 * Format: provider/model-id (Vercel AI Gateway convention)
 */
export const SUPPORTED_MODELS = [
  // Anthropic — flagship reasoning + 1M context window
  "anthropic/claude-opus-4.6",
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-haiku-4.5",

  // Google — multilingual + long-doc mastery
  "google/gemini-3.1-pro",
  "google/gemini-3-flash",

  // OpenAI — strong general knowledge
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",

  // xAI — strong reasoning, alternative perspective
  "xai/grok-4.20-beta",

  // Meta — open-source powerhouse (via Gateway)
  "meta/llama-4-maverick",
];

/**
 * Model metadata for the UI dropdown
 */
export const MODEL_INFO: Record<
  string,
  { label: string; provider: string; tier: string; description: string }
> = {
  "anthropic/claude-opus-4.6": {
    label: "Claude Opus 4.6",
    provider: "Anthropic",
    tier: "flagship",
    description: "Best theological reasoning, 1M tokens",
  },
  "anthropic/claude-sonnet-4.6": {
    label: "Claude Sonnet 4.6",
    provider: "Anthropic",
    tier: "balanced",
    description: "Near-Opus quality, faster and cheaper",
  },
  "anthropic/claude-haiku-4.5": {
    label: "Claude Haiku 4.5",
    provider: "Anthropic",
    tier: "fast",
    description: "Lightning-fast responses",
  },
  "google/gemini-3.1-pro": {
    label: "Gemini 3.1 Pro",
    provider: "Google",
    tier: "flagship",
    description: "Excellent multilingual + long documents",
  },
  "google/gemini-3-flash": {
    label: "Gemini 3 Flash",
    provider: "Google",
    tier: "fast",
    description: "Pro reasoning at flash speed",
  },
  "openai/gpt-5-mini": {
    label: "GPT-5 Mini",
    provider: "OpenAI",
    tier: "balanced",
    description: "Strong Bible knowledge, affordable",
  },
  "openai/gpt-5-nano": {
    label: "GPT-5 Nano",
    provider: "OpenAI",
    tier: "fast",
    description: "Quick answers, lowest cost",
  },
  "xai/grok-4.20-beta": {
    label: "Grok 4.20",
    provider: "xAI",
    tier: "flagship",
    description: "Strong reasoning, unique perspective",
  },
  "meta/llama-4-maverick": {
    label: "Llama 4 Maverick",
    provider: "Meta",
    tier: "balanced",
    description: "Open-source MoE powerhouse",
  },
};
