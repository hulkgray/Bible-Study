import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { dictionaryQuerySchema } from "@/lib/validations/bible";

/**
 * GET /api/dictionary?q=aaron&limit=20
 * Search Easton's Bible Dictionary entries.
 * Compliance: #5 (raw SQL), #7 (Zod validation), #9 ({ data } wrapping)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validationResult = dictionaryQuerySchema.safeParse(searchParams);

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

    // Search by headword (prefix match) first, then full-text fallback
    const rows = await sql`
      SELECT id, headword, definition
      FROM dictionary_entries
      WHERE headword ILIKE ${q + '%'}
         OR to_tsvector('english', definition) @@ plainto_tsquery('english', ${q})
      ORDER BY 
        CASE WHEN headword ILIKE ${q + '%'} THEN 0 ELSE 1 END,
        headword
      LIMIT ${limit}
    `;

    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.id,
        headword: r.headword,
        definition: r.definition,
      })),
    });
  } catch (error) {
    console.error("[API /dictionary] Database error:", error);
    return NextResponse.json(
      { error: "Dictionary search failed" },
      { status: 500 }
    );
  }
}
