import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createFolderSchema } from "@/lib/validations/notes";

/**
 * GET /api/notes/folders — List all folders for the authenticated user
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDbClient();
    const folders = await sql`
      SELECT id, name, parent_id, color, created_at, updated_at
      FROM note_folders
      WHERE user_id = ${user.userId}
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
 * POST /api/notes/folders — Create a folder for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      INSERT INTO note_folders (user_id, name, parent_id, color)
      VALUES (${user.userId}, ${name}, ${parentId}, ${color})
      RETURNING id, name, parent_id, color, created_at, updated_at
    `;

    const f = rows[0];
    console.log(`[API /notes/folders] Created folder: name="${f.name}", user=${user.userId}`);

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
