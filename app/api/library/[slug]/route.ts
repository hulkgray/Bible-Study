import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

/**
 * GET /api/library/[slug]
 * Get book details with chapter list (eager-loaded).
 * Compliance: #5 (raw SQL), #9 ({ data } wrapping), Phase 2 (N+1 elimination via eager-load)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const sql = getDbClient();

    // Eager-load: book metadata + chapter list in one query
    const rows = await sql`
      SELECT 
        lb.id, lb.slug, lb.title, lb.author, lb.book_type, lb.description,
        json_agg(
          json_build_object(
            'chapterNumber', lc.chapter_number,
            'title', lc.title
          ) ORDER BY lc.chapter_number
        ) FILTER (WHERE lc.id IS NOT NULL) as chapters
      FROM library_books lb
      LEFT JOIN library_chapters lc ON lc.book_id = lb.id
      WHERE lb.slug = ${slug}
      GROUP BY lb.id
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: `Book "${slug}" not found` },
        { status: 404 }
      );
    }

    const book = rows[0];
    return NextResponse.json({
      data: {
        id: book.id,
        slug: book.slug,
        title: book.title,
        author: book.author,
        bookType: book.book_type,
        description: book.description,
        chapters: book.chapters ?? [],
      },
    });
  } catch (error) {
    console.error("[API /library/[slug]] Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}
