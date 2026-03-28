import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { updateNoteSchema } from "@/lib/validations/notes";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

/**
 * GET /api/notes/[id] — Get a single note (user-scoped)
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

    const rows = await sql`
      SELECT id, title, content, folder_id, color, pinned, links, created_at, updated_at
      FROM study_notes
      WHERE id = ${id} AND user_id = ${user.userId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const n = rows[0];
    return NextResponse.json({
      data: {
        id: n.id,
        type: "note",
        title: n.title,
        content: n.content,
        folderId: n.folder_id,
        color: n.color,
        pinned: n.pinned,
        links: n.links,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      },
    });
  } catch (error) {
    console.error("[API /notes/[id]] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

/**
 * PATCH /api/notes/[id] — Update a note (user-scoped)
 */
export async function PATCH(
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
    const result = updateNoteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const sql = getDbClient();
    const { title, content, folderId, color, pinned, links } = result.data;

    const rows = await sql`
      UPDATE study_notes
      SET
        title = COALESCE(${title ?? null}, title),
        content = COALESCE(${content ? JSON.stringify(content) : null}::jsonb, content),
        folder_id = ${folderId !== undefined ? folderId : null},
        color = COALESCE(${color ?? null}, color),
        pinned = COALESCE(${pinned ?? null}, pinned),
        links = COALESCE(${links ? JSON.stringify(links) : null}::jsonb, links),
        updated_at = now()
      WHERE id = ${id} AND user_id = ${user.userId}
      RETURNING id, title, content, folder_id, color, pinned, links, created_at, updated_at
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const n = rows[0];
    return NextResponse.json({
      data: {
        id: n.id,
        type: "note",
        title: n.title,
        content: n.content,
        folderId: n.folder_id,
        color: n.color,
        pinned: n.pinned,
        links: n.links,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      },
    });
  } catch (error) {
    console.error("[API /notes/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

/**
 * DELETE /api/notes/[id] — Delete a note (user-scoped)
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

    const result = await sql`DELETE FROM study_notes WHERE id = ${id} AND user_id = ${user.userId} RETURNING id`;

    if (result.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { deleted: true, id } });
  } catch (error) {
    console.error("[API /notes/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
