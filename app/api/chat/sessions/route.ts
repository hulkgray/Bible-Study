import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { z } from "zod";

const createSessionSchema = z.object({
  title: z.string().max(500).optional().default("New Conversation"),
  modelId: z.string().max(100).optional().default("anthropic/claude-opus-4.6"),
});

/**
 * GET /api/chat/sessions — List all chat sessions (most recent first)
 */
export async function GET() {
  try {
    const sql = getDbClient();
    const sessions = await sql`
      SELECT s.id, s.title, s.model_id, s.created_at, s.updated_at,
             (SELECT COUNT(*) FROM chat_messages WHERE session_id = s.id) as message_count
      FROM chat_sessions s
      ORDER BY s.updated_at DESC
      LIMIT 50
    `;

    return NextResponse.json({
      data: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        modelId: s.model_id,
        messageCount: Number(s.message_count),
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
    });
  } catch (error) {
    console.error("[API /chat/sessions] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

/**
 * POST /api/chat/sessions — Create a new chat session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, modelId } = result.data;
    const sql = getDbClient();

    const rows = await sql`
      INSERT INTO chat_sessions (title, model_id)
      VALUES (${title}, ${modelId})
      RETURNING id, title, model_id, created_at, updated_at
    `;

    const s = rows[0];
    return NextResponse.json({
      data: {
        id: s.id,
        title: s.title,
        modelId: s.model_id,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[API /chat/sessions] POST error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
