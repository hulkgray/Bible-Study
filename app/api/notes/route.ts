import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createNoteSchema, listNotesSchema } from "@/lib/validations/notes";

/**
 * GET /api/notes — List notes for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryResult = listNotesSchema.safeParse(searchParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: queryResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { folderId, search } = queryResult.data;
    const sql = getDbClient();

    let notes;

    if (search) {
      notes = await sql`
        SELECT id, title, content, folder_id, color, pinned, links, created_at, updated_at
        FROM study_notes
        WHERE user_id = ${user.userId}
          AND (title ILIKE ${'%' + search + '%'} OR content::text ILIKE ${'%' + search + '%'})
        ORDER BY pinned DESC, updated_at DESC
        LIMIT 50
      `;
    } else if (folderId) {
      notes = await sql`
        SELECT id, title, content, folder_id, color, pinned, links, created_at, updated_at
        FROM study_notes
        WHERE user_id = ${user.userId} AND folder_id = ${folderId}
        ORDER BY pinned DESC, updated_at DESC
      `;
    } else {
      notes = await sql`
        SELECT id, title, content, folder_id, color, pinned, links, created_at, updated_at
        FROM study_notes
        WHERE user_id = ${user.userId} AND folder_id IS NULL
        ORDER BY pinned DESC, updated_at DESC
      `;
    }

    return NextResponse.json({
      data: notes.map((n) => ({
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
      })),
    });
  } catch (error) {
    console.error("[API /notes] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

/**
 * POST /api/notes — Create a note for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createNoteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, content, folderId, color, links } = result.data;
    const sql = getDbClient();

    const rows = await sql`
      INSERT INTO study_notes (user_id, title, content, folder_id, color, links)
      VALUES (${user.userId}, ${title}, ${JSON.stringify(content)}, ${folderId}, ${color}, ${JSON.stringify(links)})
      RETURNING id, title, content, folder_id, color, pinned, links, created_at, updated_at
    `;

    const n = rows[0];
    console.log(`[API /notes] Created note: title="${n.title}", user=${user.userId}`);

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
    }, { status: 201 });
  } catch (error) {
    console.error("[API /notes] POST error:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
