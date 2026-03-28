import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

/**
 * GET /api/devotional/today
 * Returns today's devotional entry from Faith's Checkbook.
 * Compliance: #5 (raw SQL), #9 ({ data } wrapping)
 */
export async function GET() {
  try {
    const now = new Date();
    const month = now.getMonth() + 1; // JS months are 0-indexed
    const day = now.getDate();
    const sql = getDbClient();

    const rows = await sql`
      SELECT de.id, de.month, de.day, de.title, de.scripture_ref, de.content,
             lb.title as book_title, lb.author as book_author
      FROM devotional_entries de
      JOIN library_books lb ON lb.id = de.book_id
      WHERE de.month = ${month}
        AND de.day = ${day}
      LIMIT 1
    `;

    if (rows.length === 0) {
      // Fallback: return the closest available entry
      return NextResponse.json({
        data: null,
        meta: { message: `No devotional entry found for ${month}/${day}` },
      });
    }

    const entry = rows[0];
    return NextResponse.json({
      data: {
        id: entry.id,
        month: entry.month,
        day: entry.day,
        title: entry.title,
        scriptureRef: entry.scripture_ref,
        content: entry.content,
        bookTitle: entry.book_title,
        bookAuthor: entry.book_author,
      },
    });
  } catch (error) {
    console.error("[API /devotional/today] Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch today's devotional" },
      { status: 500 }
    );
  }
}
