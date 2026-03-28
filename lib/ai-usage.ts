import { getDbClient } from "@/lib/db";

/**
 * Per-1M-token pricing (USD) for each supported model.
 * These are estimates based on public pricing as of March 2026.
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "anthropic/claude-opus-4.6":   { input: 15.00,  output: 75.00 },
  "anthropic/claude-sonnet-4.6": { input: 3.00,   output: 15.00 },
  "anthropic/claude-haiku-4.5":  { input: 0.80,   output: 4.00  },
  "google/gemini-3.1-pro":       { input: 1.25,   output: 5.00  },
  "google/gemini-3-flash":       { input: 0.15,   output: 0.60  },
  "openai/gpt-5-mini":           { input: 0.40,   output: 1.60  },
  "openai/gpt-5-nano":           { input: 0.10,   output: 0.40  },
  "xai/grok-4.20-beta":          { input: 5.00,   output: 15.00 },
  "meta/llama-4-maverick":       { input: 0.20,   output: 0.60  },
};

/**
 * Calculates estimated cost for a given usage.
 */
export function estimateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[modelId];
  if (!pricing) return 0;

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return parseFloat((inputCost + outputCost).toFixed(6));
}

/**
 * Logs token usage to the ai_usage_log table.
 * Called from the chat route's onFinish callback.
 * Non-blocking — errors are logged but never thrown to the caller.
 */
export async function logTokenUsage(params: {
  userId: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  sessionId?: string;
}): Promise<void> {
  try {
    const sql = getDbClient();
    const totalTokens = params.promptTokens + params.completionTokens;
    const estimatedCost = estimateCost(
      params.modelId,
      params.promptTokens,
      params.completionTokens
    );

    await sql`
      INSERT INTO ai_usage_log (user_id, model_id, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, session_id)
      VALUES (
        ${params.userId},
        ${params.modelId},
        ${params.promptTokens},
        ${params.completionTokens},
        ${totalTokens},
        ${estimatedCost},
        ${params.sessionId || null}
      )
    `;

    console.log(
      `[AI Usage] Logged: user=${params.userId}, model=${params.modelId}, tokens=${totalTokens}, cost=$${estimatedCost}`
    );
  } catch (error) {
    // Non-blocking — never crash the chat response due to usage logging failures
    console.error("[AI Usage] Failed to log token usage:", error);
  }
}
