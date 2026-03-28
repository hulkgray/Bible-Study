import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { z } from "zod";

const updateFolderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  parentId: z.string().uuid().nullable().optional(),
  color: z.string().max(20).optional(),
});

const paramsSchema = z.object({
  id: z.string().uuid(),
});

/**
 * PATCH /api/notes/folders/[id] — Update a folder
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = paramsSchema.parse(await params);
    const body = await request.json();
    const result = updateFolderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, parentId, color } = result.data;
    const sql = getDbClient();

    const rows = await sql`
      UPDATE note_folders
      SET
        name = COALESCE(${name ?? null}, name),
        parent_id = COALESCE(${parentId ?? null}, parent_id),
        color = COALESCE(${color ?? null}, color),
        updated_at = now()
      WHERE id = ${id}
      RETURNING id, name, parent_id, color, created_at, updated_at
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

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
    });
  } catch (error) {
    console.error("[API /notes/folders/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
  }
}

/**
 * DELETE /api/notes/folders/[id] — Delete a folder (moves contents to root)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = paramsSchema.parse(await params);
    const sql = getDbClient();

    // Move notes out of folder → root
    await sql`UPDATE study_notes SET folder_id = NULL WHERE folder_id = ${id}`;
    // Move subfolders out → root
    await sql`UPDATE note_folders SET parent_id = NULL WHERE parent_id = ${id}`;
    // Delete folder
    const result = await sql`DELETE FROM note_folders WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { deleted: true, id } });
  } catch (error) {
    console.error("[API /notes/folders/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
