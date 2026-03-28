import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

/**
 * GET /api/library
 * List all library books (Spurgeon, Bunyan, Catechism, etc.).
 * Compliance: #5 (raw SQL), #9 ({ data } wrapping)
 */
export async function GET() {
  try {
    const sql = getDbClient();

    const rows = await sql`
      SELECT id, slug, title, author, book_type, description
      FROM library_books
      ORDER BY title
    `;

    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        author: r.author,
        bookType: r.book_type,
        description: r.description,
      })),
    });
  } catch (error) {
    console.error("[API /library] Database error:", error);
    return NextResponse.json(
      { error: "Failed to list library books" },
      { status: 500 }
    );
  }
}
