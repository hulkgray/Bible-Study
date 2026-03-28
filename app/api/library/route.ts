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
      SELECT id, slug, title, author, book_type, description, category, source_url
      FROM library_books
      ORDER BY 
        CASE book_type
          WHEN 'book' THEN 1
          WHEN 'devotional' THEN 2
          WHEN 'catechism' THEN 3
          WHEN 'prayers' THEN 4
          WHEN 'apocrypha' THEN 5
          ELSE 6
        END,
        title
    `;

    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        author: r.author,
        bookType: r.book_type,
        description: r.description,
        category: r.category ?? "theology",
        sourceUrl: r.source_url,
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
