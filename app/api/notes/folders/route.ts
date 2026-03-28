import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { z } from "zod";

/**
 * Folder Schemas
 */
const createFolderSchema = z.object({
  name: z.string().min(1).max(200),
  parentId: z.string().uuid().nullable().optional().default(null),
  color: z.string().max(20).optional().default("default"),
});

/**
 * GET /api/notes/folders — List all folders
 */
export async function GET() {
  try {
    const sql = getDbClient();
    const folders = await sql`
      SELECT id, name, parent_id, color, created_at, updated_at
      FROM note_folders
      ORDER BY name ASC
    `;

    return NextResponse.json({
      data: folders.map((f) => ({
        id: f.id,
        type: "folder",
        name: f.name,
        parentId: f.parent_id,
        color: f.color,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      })),
    });
  } catch (error) {
    console.error("[API /notes/folders] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
  }
}

/**
 * POST /api/notes/folders — Create a folder
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createFolderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, parentId, color } = result.data;
    const sql = getDbClient();

    const rows = await sql`
      INSERT INTO note_folders (name, parent_id, color)
      VALUES (${name}, ${parentId}, ${color})
      RETURNING id, name, parent_id, color, created_at, updated_at
    `;

    const f = rows[0];
    return NextResponse.json({
      data: {
        id: f.id,
        type: "folder",
        name: f.name,
        parentId: f.parent_id,
        color: f.color,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[API /notes/folders] POST error:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
