import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { z } from "zod";

const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(100),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

/**
 * GET /api/strongs/search?q=love&limit=20
 * Search Strong's entries by English word — matches against definition,
 * transliteration, and original_word fields.
 *
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

    const { q, limit } = validationResult.data;
    const sql = getDbClient();

    // Search definitions, transliterations, and original words
    // Use ILIKE for case-insensitive matching
    // Prioritize exact word matches in definition over partial matches
    const pattern = `%${q}%`;
    const wordPattern = `% ${q} %`; // word boundary match

    const rows = await sql`
      SELECT strongs_number, language, original_word, 
             transliteration, pronunciation, definition
      FROM strongs_entries
      WHERE definition ILIKE ${pattern}
         OR transliteration ILIKE ${pattern}
         OR original_word ILIKE ${pattern}
      ORDER BY
        CASE 
          WHEN definition ILIKE ${wordPattern} THEN 0
          WHEN transliteration ILIKE ${q} THEN 0
          WHEN definition ILIKE ${q + '%'} THEN 1
          ELSE 2
        END,
        strongs_number
      LIMIT ${limit}
    `;

    return NextResponse.json({
      data: rows.map((r) => ({
        strongsNumber: r.strongs_number,
        language: r.language,
        originalWord: r.original_word,
        transliteration: r.transliteration,
        pronunciation: r.pronunciation,
        definition: r.definition,
      })),
    });
  } catch (error) {
    console.error("[API /strongs/search] Database error:", error);
    return NextResponse.json(
      { error: "Failed to search Strong's entries" },
      { status: 500 }
    );
  }
}
