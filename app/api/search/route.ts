import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { z } from "zod";

/**
 * Global Search Schema
 */
const globalSearchSchema = z.object({
  q: z.string().min(1, "Search query is required").max(200),
  limit: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "10", 10))
    .pipe(z.number().min(1).max(50)),
});

/**
 * GET /api/search?q=faith&limit=10
 * Unified search across Bible verses, dictionary, Strong's, and library.
 * Returns categorized results from all content types.
 * Compliance: #5 (raw SQL), #7 (Zod validation), #9 ({ data } wrapping)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validationResult = globalSearchSchema.safeParse(searchParams);

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

    // Run all searches in parallel for speed
    const [bibleResults, dictionaryResults, strongsResults, libraryResults] =
      await Promise.all([
        // Bible verse search (KJV default)
        sql`
        SELECT 'bible' as source_type, 
               book || ' ' || chapter || ':' || verse as ref,
               book, chapter::int, verse::int, translation_code,
               ts_headline('english', text, plainto_tsquery('english', ${q}),
                 'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=15'
               ) as highlight,
               text
        FROM bible_verses
        WHERE translation_code = 'kjv'
          AND to_tsvector('english', text) @@ plainto_tsquery('english', ${q})
        ORDER BY book_number, chapter, verse
        LIMIT ${limit}
      `,

        // Dictionary search
        sql`
        SELECT 'dictionary' as source_type,
               headword as ref,
               headword,
               ts_headline('english', definition, plainto_tsquery('english', ${q}),
                 'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=15'
               ) as highlight,
               definition as text
        FROM dictionary_entries
        WHERE headword ILIKE ${q + "%"}
           OR to_tsvector('english', definition) @@ plainto_tsquery('english', ${q})
        ORDER BY 
          CASE WHEN headword ILIKE ${q + "%"} THEN 0 ELSE 1 END,
          headword
        LIMIT ${limit}
      `,

        // Strong's search (by number or definition)
        sql`
        SELECT 'strongs' as source_type,
               strongs_number as ref,
               strongs_number, language, original_word,
               definition as highlight,
               definition as text
        FROM strongs_entries
        WHERE strongs_number ILIKE ${q + "%"}
           OR to_tsvector('english', definition) @@ plainto_tsquery('english', ${q})
        LIMIT ${limit}
      `,

        // Library search (chapter content)
        sql`
        SELECT 'library' as source_type,
               lb.title || ' — ' || lc.title as ref,
               lb.slug as book_slug, lb.title as book_title, lb.author,
               lc.chapter_number,
               ts_headline('english', lc.content, plainto_tsquery('english', ${q}),
                 'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=15'
               ) as highlight
        FROM library_chapters lc
        JOIN library_books lb ON lb.id = lc.book_id
        WHERE to_tsvector('english', lc.content) @@ plainto_tsquery('english', ${q})
        LIMIT ${limit}
      `,
      ]);

    return NextResponse.json({
      data: {
        bible: bibleResults.map((r) => ({
          sourceType: "bible",
          ref: r.ref,
          book: r.book,
          chapter: r.chapter,
          verse: r.verse,
          highlight: r.highlight,
        })),
        dictionary: dictionaryResults.map((r) => ({
          sourceType: "dictionary",
          ref: r.ref,
          headword: r.headword,
          highlight: r.highlight,
        })),
        strongs: strongsResults.map((r) => ({
          sourceType: "strongs",
          ref: r.ref,
          strongsNumber: r.strongs_number,
          language: r.language,
          originalWord: r.original_word,
          highlight: r.highlight,
        })),
        library: libraryResults.map((r) => ({
          sourceType: "library",
          ref: r.ref,
          bookSlug: r.book_slug,
          bookTitle: r.book_title,
          author: r.author,
          chapterNumber: r.chapter_number,
          highlight: r.highlight,
        })),
      },
      meta: {
        query: q,
        totalResults:
          bibleResults.length +
          dictionaryResults.length +
          strongsResults.length +
          libraryResults.length,
      },
    });
  } catch (error) {
    console.error("[API /search] Database error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
