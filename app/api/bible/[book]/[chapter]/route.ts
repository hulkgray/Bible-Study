import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getBookBySlug } from "@/lib/bible-books";
import { chapterQuerySchema } from "@/lib/validations/bible";
import type { ParallelVerse } from "@/types/bible";

/**
 * GET /api/bible/[book]/[chapter]
 * Returns all verses for a given book and chapter across selected translations.
 * Compliance: #5 (raw SQL), #7 (Zod validation), #9 ({ data } wrapping)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ book: string; chapter: string }> }
) {
  try {
    const { book: bookSlug, chapter: chapterStr } = await params;
    const chapterNum = parseInt(chapterStr, 10);

    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json(
        { error: "Invalid chapter number" },
        { status: 400 }
      );
    }

    const bookInfo = getBookBySlug(bookSlug);
    if (!bookInfo) {
      return NextResponse.json(
        { error: `Book "${bookSlug}" not found` },
        { status: 404 }
      );
    }

    if (chapterNum > bookInfo.chapters) {
      return NextResponse.json(
        { error: `${bookInfo.name} only has ${bookInfo.chapters} chapters` },
        { status: 404 }
      );
    }

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validationResult = chapterQuerySchema.safeParse(searchParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { translations } = validationResult.data;
    const sql = getDbClient();

    // Fetch all verses for this chapter across requested translations
    const rows = await sql`
      SELECT verse, translation_code, text, tagged_text
      FROM bible_verses
      WHERE book_number = ${bookInfo.bookNumber}
        AND chapter = ${chapterNum}
        AND translation_code = ANY(${translations})
      ORDER BY verse, translation_code
    `;

    // Group by verse number into parallel format
    const versesMap = new Map<number, Record<string, string>>();
    const taggedMap = new Map<number, string | null>();
    for (const row of rows) {
      const v = row.verse as number;
      if (!versesMap.has(v)) {
        versesMap.set(v, {});
      }
      versesMap.get(v)![row.translation_code as string] = row.text as string;
      // Store tagged_text for KJV only
      if (row.translation_code === "kjv" && row.tagged_text) {
        taggedMap.set(v, row.tagged_text as string);
      }
    }

    const verses = Array.from(versesMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([verseNum, translationTexts]) => ({
        book: bookInfo.name,
        chapter: chapterNum,
        verse: verseNum,
        translations: translationTexts,
        taggedText: taggedMap.get(verseNum) ?? null,
      }));

    return NextResponse.json({
      data: {
        book: bookInfo.name,
        bookNumber: bookInfo.bookNumber,
        chapter: chapterNum,
        totalChapters: bookInfo.chapters,
        verses,
      },
    });
  } catch (error) {
    console.error("[API /bible/[book]/[chapter]] Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter" },
      { status: 500 }
    );
  }
}
