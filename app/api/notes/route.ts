import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { z } from "zod";

/**
 * Note Schemas
 */
const createNoteSchema = z.object({
  title: z.string().min(1).max(500).optional().default("Untitled Note"),
  content: z.any().optional().default({}),
  folderId: z.string().uuid().nullable().optional().default(null),
  color: z.string().max(20).optional().default("default"),
  links: z.array(z.object({
    type: z.enum(["verse", "dictionary", "strongs", "library", "devotional"]),
    ref: z.string(),
    href: z.string(),
  })).optional().default([]),
});

const listNotesSchema = z.object({
  folderId: z.string().uuid().nullable().optional(),
  search: z.string().max(200).optional(),
});

/**
 * GET /api/notes — List notes (optionally filtered by folder or search)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { folderId, search } = listNotesSchema.parse(searchParams);
    const sql = getDbClient();

    let notes;

    if (search) {
      // Search across all notes
      notes = await sql`
        SELECT id, title, content, folder_id, color, pinned, links, created_at, updated_at
        FROM study_notes
        WHERE title ILIKE ${'%' + search + '%'}
           OR content::text ILIKE ${'%' + search + '%'}
        ORDER BY pinned DESC, updated_at DESC
        LIMIT 50
      `;
    } else if (folderId) {
      notes = await sql`
        SELECT id, title, content, folder_id, color, pinned, links, created_at, updated_at
        FROM study_notes
        WHERE folder_id = ${folderId}
        ORDER BY pinned DESC, updated_at DESC
      `;
    } else {
      // Root notes (no folder) + all pinned
      notes = await sql`
        SELECT id, title, content, folder_id, color, pinned, links, created_at, updated_at
        FROM study_notes
        WHERE folder_id IS NULL
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
 * POST /api/notes — Create a note
 */
export async function POST(request: NextRequest) {
  try {
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
      INSERT INTO study_notes (title, content, folder_id, color, links)
      VALUES (${title}, ${JSON.stringify(content)}, ${folderId}, ${color}, ${JSON.stringify(links)})
      RETURNING id, title, content, folder_id, color, pinned, links, created_at, updated_at
    `;

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
    }, { status: 201 });
  } catch (error) {
    console.error("[API /notes] POST error:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
