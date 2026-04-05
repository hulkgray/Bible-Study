import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { updateNoteSchema } from "@/lib/validations/notes";
import { z } from "zod";

const paramsSchema = z.object({
  slug: z.string().min(1).max(20),
});

/**
 * GET /api/notes/by-slug/[slug] — Get a note by its public slug.
 * - If the note is private, requires authentication and ownership.
 * - If share_mode is 'view' or 'edit', allows unauthenticated access.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = paramsSchema.parse(await params);
    const sql = getDbClient();

    const rows = await sql`
      SELECT id, slug, user_id, title, content, folder_id, color, pinned, links, share_mode, created_at, updated_at
      FROM study_notes
      WHERE slug = ${slug}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const n = rows[0];

    // If private, require auth and ownership
    if (n.share_mode === "private") {
      const user = await getCurrentUser();
      if (!user || user.userId !== n.user_id) {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
      }
    }

    // Determine if current viewer is the owner
    const user = await getCurrentUser().catch(() => null);
    const isOwner = user ? user.userId === n.user_id : false;

    return NextResponse.json({
      data: {
        id: n.id,
        slug: n.slug,
        type: "note",
        title: n.title,
        content: n.content,
        folderId: n.folder_id,
        color: n.color,
        pinned: n.pinned,
        links: n.links,
        shareMode: n.share_mode,
        isOwner,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      },
    });
  } catch (error) {
    console.error("[API /notes/by-slug/[slug]] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

/**
 * PATCH /api/notes/by-slug/[slug] — Update a note by slug.
 * - Owner can always update.
 * - If share_mode is 'edit', anyone can update content/title.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = paramsSchema.parse(await params);
    const sql = getDbClient();

    // First, get the note to check permissions
    const existing = await sql`
      SELECT id, user_id, share_mode FROM study_notes WHERE slug = ${slug}
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const note = existing[0];
    const user = await getCurrentUser().catch(() => null);
    const isOwner = user ? user.userId === note.user_id : false;

    // Only allow edit if owner OR share_mode === 'edit'
    if (!isOwner && note.share_mode !== "edit") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = updateNoteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, content, links } = result.data;

    // Non-owners can only update title, content and links — not share_mode, color, pinned, folder
    const rows = await sql`
      UPDATE study_notes
      SET
        title = COALESCE(${title ?? null}, title),
        content = COALESCE(${content ? JSON.stringify(content) : null}::jsonb, content),
        links = COALESCE(${links ? JSON.stringify(links) : null}::jsonb, links),
        updated_at = now()
      WHERE slug = ${slug}
      RETURNING id, slug, title, content, folder_id, color, pinned, links, share_mode, created_at, updated_at
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const n = rows[0];
    return NextResponse.json({
      data: {
        id: n.id,
        slug: n.slug,
        type: "note",
        title: n.title,
        content: n.content,
        folderId: n.folder_id,
        color: n.color,
        pinned: n.pinned,
        links: n.links,
        shareMode: n.share_mode,
        isOwner,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      },
    });
  } catch (error) {
    console.error("[API /notes/by-slug/[slug]] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}
