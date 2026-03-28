import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { bookmarkToggleSchema, bookmarkQuerySchema } from "@/lib/validations/auth";

/**
 * GET /api/bookmarks
 * List bookmarks for the authenticated user, optionally filtered by book/chapter.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDbClient();
    const rawParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryResult = bookmarkQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: queryResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { book_number, chapter } = queryResult.data;

    let rows;
    if (book_number && chapter) {
      rows = await sql`
        SELECT id, book, book_number, chapter, verse, translation_code, note, created_at
        FROM bookmarks
        WHERE user_id = ${user.userId}
          AND book_number = ${book_number}
          AND chapter = ${chapter}
        ORDER BY verse
      `;
    } else {
      rows = await sql`
        SELECT id, book, book_number, chapter, verse, translation_code, note, created_at
        FROM bookmarks
        WHERE user_id = ${user.userId}
        ORDER BY created_at DESC
        LIMIT 200
      `;
    }

    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.id,
        book: r.book,
        bookNumber: r.book_number,
        chapter: r.chapter,
        verse: r.verse,
        translationCode: r.translation_code,
        note: r.note,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error("[API /bookmarks] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookmarks
 * Toggle a bookmark — if it exists for this user, delete it; if not, create it.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = bookmarkToggleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { book, bookNumber, chapter, verse, translationCode } = validationResult.data;
    const sql = getDbClient();

    // Check if bookmark exists for this user (defense-in-depth: WHERE user_id)
    const existing = await sql`
      SELECT id FROM bookmarks
      WHERE user_id = ${user.userId}
        AND book_number = ${bookNumber}
        AND chapter = ${chapter}
        AND verse = ${verse}
        AND translation_code = ${translationCode}
    `;

    if (existing.length > 0) {
      // Delete existing bookmark (toggle off) — defense-in-depth: ensure user_id match
      await sql`DELETE FROM bookmarks WHERE id = ${existing[0].id} AND user_id = ${user.userId}`;
      return NextResponse.json({
        data: { action: "deleted", id: existing[0].id },
      });
    }

    // Create new bookmark
    const rows = await sql`
      INSERT INTO bookmarks (user_id, book, book_number, chapter, verse, translation_code)
      VALUES (${user.userId}, ${book}, ${bookNumber}, ${chapter}, ${verse}, ${translationCode})
      RETURNING id, book, book_number, chapter, verse, translation_code, created_at
    `;

    const r = rows[0];
    console.log(`[API /bookmarks] Created bookmark: ${book} ${chapter}:${verse}, user=${user.userId}`);

    return NextResponse.json({
      data: {
        action: "created",
        bookmark: {
          id: r.id,
          book: r.book,
          bookNumber: r.book_number,
          chapter: r.chapter,
          verse: r.verse,
          translationCode: r.translation_code,
          createdAt: r.created_at,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[API /bookmarks] POST error:", error);
    return NextResponse.json(
      { error: "Failed to toggle bookmark" },
      { status: 500 }
    );
  }
}
