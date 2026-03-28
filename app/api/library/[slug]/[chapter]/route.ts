import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

/**
 * GET /api/library/[slug]/[chapter]
 * Get chapter content for a library book.
 * Compliance: #5 (raw SQL), #9 ({ data } wrapping)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; chapter: string }> }
) {
  try {
    const { slug, chapter: chapterStr } = await params;
    const chapterNum = parseInt(chapterStr, 10);

    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json(
        { error: "Invalid chapter number" },
        { status: 400 }
      );
    }

    const sql = getDbClient();

    const rows = await sql`
      SELECT lc.id, lc.chapter_number, lc.title, lc.content,
             lb.title as book_title, lb.author as book_author
      FROM library_chapters lc
      JOIN library_books lb ON lb.id = lc.book_id
      WHERE lb.slug = ${slug}
        AND lc.chapter_number = ${chapterNum}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: `Chapter ${chapterNum} of "${slug}" not found` },
        { status: 404 }
      );
    }

    const chapter = rows[0];
    return NextResponse.json({
      data: {
        id: chapter.id,
        chapterNumber: chapter.chapter_number,
        title: chapter.title,
        content: chapter.content,
        bookTitle: chapter.book_title,
        bookAuthor: chapter.book_author,
      },
    });
  } catch (error) {
    console.error("[API /library/[slug]/[chapter]] Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter" },
      { status: 500 }
    );
  }
}
