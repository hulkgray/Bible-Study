import { NextResponse } from "next/server";
import { BIBLE_BOOKS, TRANSLATIONS } from "@/lib/bible-books";

/**
 * GET /api/bible
 * Returns the list of all 66 books with chapter counts and available translations.
 * Compliance: #9 ({ data } wrapping)
 */
export async function GET() {
  try {
    const books = BIBLE_BOOKS.map((b) => ({
      bookNumber: b.bookNumber,
      name: b.name,
      slug: b.slug,
      testament: b.testament,
      chapters: b.chapters,
    }));

    return NextResponse.json({
      data: {
        books,
        translations: TRANSLATIONS,
      },
    });
  } catch (error) {
    console.error("[API /bible] Error listing books:", error);
    return NextResponse.json(
      { error: "Failed to list books" },
      { status: 500 }
    );
  }
}
