import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { searchQuerySchema } from "@/lib/validations/bible";

/**
 * GET /api/bible/search?q=faith&translation=kjv&page=1&limit=20
 * Full-text search across Bible verses using PostgreSQL ts_vector.
 * Compliance: #5 (raw SQL), #7 (Zod validation), #9 ({ data } wrapping)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validationResult = searchQuerySchema.safeParse(searchParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid search parameters",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { q, translation, page, limit } = validationResult.data;
    const offset = (page - 1) * limit;
    const sql = getDbClient();

    // Full-text search with ts_headline for highlighted snippets
    const rows = await sql`
      SELECT 
        book, book_number, chapter, verse, translation_code, text,
        ts_headline('english', text, plainto_tsquery('english', ${q}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
        ) as highlight
      FROM bible_verses
      WHERE translation_code = ${translation}
        AND to_tsvector('english', text) @@ plainto_tsquery('english', ${q})
      ORDER BY book_number, chapter, verse
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count for pagination
    const countResult = await sql`
      SELECT COUNT(*)::int as total
      FROM bible_verses
      WHERE translation_code = ${translation}
        AND to_tsvector('english', text) @@ plainto_tsquery('english', ${q})
    `;

    const total = countResult[0]?.total ?? 0;

    return NextResponse.json({
      data: rows.map((r) => ({
        book: r.book,
        bookNumber: r.book_number,
        chapter: r.chapter,
        verse: r.verse,
        translationCode: r.translation_code,
        text: r.text,
        highlight: r.highlight,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[API /bible/search] Database error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
