import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createChatSessionSchema } from "@/lib/validations/chat";

/**
 * GET /api/chat/sessions — List chat sessions for the authenticated user
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDbClient();
    const sessions = await sql`
      SELECT s.id, s.title, s.model_id, s.created_at, s.updated_at,
             (SELECT COUNT(*) FROM chat_messages WHERE session_id = s.id) as message_count
      FROM chat_sessions s
      WHERE s.user_id = ${user.userId}
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
 * POST /api/chat/sessions — Create a new chat session for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createChatSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, modelId } = result.data;
    const sql = getDbClient();

    const rows = await sql`
      INSERT INTO chat_sessions (user_id, title, model_id)
      VALUES (${user.userId}, ${title}, ${modelId})
      RETURNING id, title, model_id, created_at, updated_at
    `;

    const s = rows[0];
    console.log(`[API /chat/sessions] Created session: id=${s.id}, user=${user.userId}`);

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
