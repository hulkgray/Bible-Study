import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/**
 * GET /api/auth/usage
 * Returns AI token usage summary for the authenticated user.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDbClient();

    // Aggregate summary — defense-in-depth: WHERE user_id
    const summaryRows = await sql`
      SELECT
        COALESCE(SUM(total_tokens), 0) AS total_tokens,
        COALESCE(SUM(estimated_cost_usd), 0) AS total_cost_usd,
        COUNT(*) AS total_requests
      FROM ai_usage_log
      WHERE user_id = ${user.userId}
    `;

    // Per-model breakdown
    const byModelRows = await sql`
      SELECT
        model_id,
        COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens,
        COALESCE(SUM(completion_tokens), 0) AS completion_tokens,
        COALESCE(SUM(total_tokens), 0) AS total_tokens,
        COALESCE(SUM(estimated_cost_usd), 0) AS cost_usd,
        COUNT(*) AS requests
      FROM ai_usage_log
      WHERE user_id = ${user.userId}
      GROUP BY model_id
      ORDER BY cost_usd DESC
    `;

    // Recent 20 entries
    const recentRows = await sql`
      SELECT id, model_id, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, created_at
      FROM ai_usage_log
      WHERE user_id = ${user.userId}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const summary = summaryRows[0];

    return NextResponse.json({
      data: {
        summary: {
          totalTokens: Number(summary.total_tokens),
          totalCostUsd: Number(summary.total_cost_usd),
          totalRequests: Number(summary.total_requests),
        },
        byModel: byModelRows.map((row) => ({
          modelId: row.model_id,
          promptTokens: Number(row.prompt_tokens),
          completionTokens: Number(row.completion_tokens),
          totalTokens: Number(row.total_tokens),
          costUsd: Number(row.cost_usd),
          requests: Number(row.requests),
        })),
        recent: recentRows.map((row) => ({
          id: row.id,
          modelId: row.model_id,
          promptTokens: Number(row.prompt_tokens),
          completionTokens: Number(row.completion_tokens),
          totalTokens: Number(row.total_tokens),
          costUsd: Number(row.estimated_cost_usd),
          createdAt: row.created_at,
        })),
      },
    });
  } catch (error) {
    console.error("[API /auth/usage] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
