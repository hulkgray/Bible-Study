import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { strongsParamSchema } from "@/lib/validations/bible";

/**
 * GET /api/strongs/[number]
 * Look up a Strong's concordance entry by number (e.g., G25, H430).
 * Compliance: #5 (raw SQL), #7 (Zod validation), #9 ({ data } wrapping)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;

    const validationResult = strongsParamSchema.safeParse({ number });
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid Strong's number",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Normalize to uppercase: g25 → G25
    const strongsNum = validationResult.data.number.toUpperCase();
    const sql = getDbClient();

    const rows = await sql`
      SELECT id, strongs_number, language, original_word, 
             transliteration, pronunciation, definition
      FROM strongs_entries
      WHERE strongs_number = ${strongsNum}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: `Strong's entry ${strongsNum} not found` },
        { status: 404 }
      );
    }

    const entry = rows[0];
    return NextResponse.json({
      data: {
        id: entry.id,
        strongsNumber: entry.strongs_number,
        language: entry.language,
        originalWord: entry.original_word,
        transliteration: entry.transliteration,
        pronunciation: entry.pronunciation,
        definition: entry.definition,
      },
    });
  } catch (error) {
    console.error("[API /strongs/[number]] Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Strong's entry" },
      { status: 500 }
    );
  }
}
