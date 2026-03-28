import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().uuid() });

const saveMessagesSchema = z.object({
  messages: z.array(z.object({
    role: z.string(),
    content: z.string(),
    reasoning: z.string().nullable().optional(),
  })),
});

/**
 * GET /api/chat/sessions/[id] — Get a session with all its messages (user-scoped)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = paramsSchema.parse(await params);
    const sql = getDbClient();

    const session = await sql`
      SELECT id, title, model_id, created_at, updated_at
      FROM chat_sessions WHERE id = ${id} AND user_id = ${user.userId}
    `;

    if (session.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const messages = await sql`
      SELECT id, role, content, reasoning, created_at
      FROM chat_messages
      WHERE session_id = ${id}
      ORDER BY created_at ASC
    `;

    const s = session[0];
    return NextResponse.json({
      data: {
        id: s.id,
        title: s.title,
        modelId: s.model_id,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          reasoning: m.reasoning,
          createdAt: m.created_at,
        })),
      },
    });
  } catch (error) {
    console.error("[API /chat/sessions/[id]] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

/**
 * POST /api/chat/sessions/[id] — Save messages to a session (user-scoped)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = paramsSchema.parse(await params);
    const body = await request.json();
    const result = saveMessagesSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const sql = getDbClient();

    // Verify session belongs to user (defense-in-depth)
    const sessionCheck = await sql`SELECT id FROM chat_sessions WHERE id = ${id} AND user_id = ${user.userId}`;
    if (sessionCheck.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Insert messages
    for (const msg of result.data.messages) {
      await sql`
        INSERT INTO chat_messages (session_id, role, content, reasoning)
        VALUES (${id}, ${msg.role}, ${msg.content}, ${msg.reasoning ?? null})
      `;
    }

    // Update session timestamp + auto-title from first user message
    const firstUserMsg = result.data.messages.find((m) => m.role === "user");
    if (firstUserMsg) {
      const existingTitle = await sql`SELECT title FROM chat_sessions WHERE id = ${id} AND user_id = ${user.userId}`;
      if (existingTitle[0]?.title === "New Conversation") {
        const autoTitle = firstUserMsg.content.substring(0, 80);
        await sql`UPDATE chat_sessions SET title = ${autoTitle}, updated_at = now() WHERE id = ${id} AND user_id = ${user.userId}`;
      } else {
        await sql`UPDATE chat_sessions SET updated_at = now() WHERE id = ${id} AND user_id = ${user.userId}`;
      }
    } else {
      await sql`UPDATE chat_sessions SET updated_at = now() WHERE id = ${id} AND user_id = ${user.userId}`;
    }

    return NextResponse.json({ data: { saved: true } });
  } catch (error) {
    console.error("[API /chat/sessions/[id]] POST error:", error);
    return NextResponse.json({ error: "Failed to save messages" }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/sessions/[id] — Delete a session (user-scoped, CASCADE deletes messages)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = paramsSchema.parse(await params);
    const sql = getDbClient();
    const result = await sql`DELETE FROM chat_sessions WHERE id = ${id} AND user_id = ${user.userId} RETURNING id`;
    if (result.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ data: { deleted: true, id } });
  } catch (error) {
    console.error("[API /chat/sessions/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
