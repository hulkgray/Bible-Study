/**
 * seed-library.ts — ETL script to parse library PDFs into Neon.
 *
 * Handles:
 * - chs_all_of_grace.pdf            → book: "All of Grace" by C.H. Spurgeon
 * - chs_come_ye_children.pdf        → book: "Come Ye Children" by C.H. Spurgeon
 * - chs_words_of_warning.pdf        → book: "Words of Warning for Daily Life" by C.H. Spurgeon
 * - spurgeons_prayers.pdf           → book: "Spurgeon's Prayers" by C.H. Spurgeon
 * - pilgrim_progress.pdf            → book: "The Pilgrim's Progress" by John Bunyan
 * - apuritancatechism.pdf           → catechism: "A Puritan Catechism" by C.H. Spurgeon
 * - faith-checkbook-spurgeon.pdf    → devotional: "Faith's Checkbook" by C.H. Spurgeon
 *
 * Usage: npx tsx scripts/seed-library.ts
 */
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not found in .env.local");

const sql = neon(DATABASE_URL);

// ============================================
// PDF Text Extraction
// ============================================
async function extractTextFromPDF(filePath: string): Promise<string[]> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: { str?: string }) => item.str ?? "")
      .join(" ");
    pages.push(text);
  }

  return pages;
}

// ============================================
// Book Definitions
// ============================================
interface BookDef {
  file: string;
  slug: string;
  title: string;
  author: string;
  bookType: "book" | "devotional" | "catechism" | "prayers";
  description: string;
}

const LIBRARY_BOOKS: BookDef[] = [
  {
    file: "chs_all_of_grace.pdf",
    slug: "all-of-grace",
    title: "All of Grace",
    author: "Charles H. Spurgeon",
    bookType: "book",
    description: "A classic work explaining the Gospel message of salvation by grace through faith.",
  },
  {
    file: "chs_come_ye_children.pdf",
    slug: "come-ye-children",
    title: "Come Ye Children",
    author: "Charles H. Spurgeon",
    bookType: "book",
    description: "Practical guidance on teaching children the truths of the Christian faith.",
  },
  {
    file: "chs_words_of_warning_for_daily_life.pdf",
    slug: "words-of-warning",
    title: "Words of Warning for Daily Life",
    author: "Charles H. Spurgeon",
    bookType: "book",
    description: "Short, powerful warnings and encouragements for everyday Christian living.",
  },
  {
    file: "spurgeons_prayers.pdf",
    slug: "spurgeons-prayers",
    title: "Spurgeon's Prayers",
    author: "Charles H. Spurgeon",
    bookType: "prayers",
    description: "A collection of Spurgeon's powerful public prayers from the Metropolitan Tabernacle.",
  },
  {
    file: "pilgrim_progress.pdf",
    slug: "pilgrims-progress",
    title: "The Pilgrim's Progress",
    author: "John Bunyan",
    bookType: "book",
    description: "The beloved allegorical journey of Christian from the City of Destruction to the Celestial City.",
  },
  {
    file: "apuritancatechism.pdf",
    slug: "puritan-catechism",
    title: "A Puritan Catechism",
    author: "Charles H. Spurgeon",
    bookType: "catechism",
    description: "Spurgeon's compilation of Reformed catechetical questions and answers drawn from the Westminster standards.",
  },
  {
    file: "faith-checkbook-spurgeon.pdf",
    slug: "faiths-checkbook",
    title: "Faith's Checkbook",
    author: "Charles H. Spurgeon",
    bookType: "devotional",
    description: "365 daily devotional readings, one for each day of the year, built on God's promises.",
  },
];

// ============================================
// Chunking Strategy
// ============================================

/**
 * Split PDF pages into chapters. Since these PDFs don't have consistent
 * chapter markers, we chunk by pages (5-10 pages per chapter).
 */
function chunkPages(pages: string[], pagesPerChapter: number = 5): { title: string; content: string }[] {
  const chapters: { title: string; content: string }[] = [];
  for (let i = 0; i < pages.length; i += pagesPerChapter) {
    const chunk = pages.slice(i, i + pagesPerChapter);
    const chapterNum = Math.floor(i / pagesPerChapter) + 1;
    chapters.push({
      title: `Section ${chapterNum}`,
      content: chunk.join("\n\n"),
    });
  }
  return chapters;
}

/**
 * Parse Faith's Checkbook into daily devotional entries.
 * The PDF has 365 entries, roughly one per page.
 */
function parseDevotional(pages: string[]): { month: number; day: number; title: string; scriptureRef: string; content: string }[] {
  const entries: { month: number; day: number; title: string; scriptureRef: string; content: string }[] = [];
  const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Simple distribution: assign pages to days sequentially
  let dayOfYear = 0;
  for (const pageText of pages) {
    if (!pageText.trim()) continue;

    dayOfYear++;
    let month = 0;
    let dayAccum = 0;
    for (let m = 0; m < 12; m++) {
      if (dayOfYear <= dayAccum + DAYS_IN_MONTH[m]) {
        month = m + 1;
        break;
      }
      dayAccum += DAYS_IN_MONTH[m];
    }
    const day = dayOfYear - dayAccum;

    if (month === 0 || day <= 0 || dayOfYear > 366) continue;

    // Try to extract a scripture reference from the first line
    const lines = pageText.split(/(?:\. |\n)/).filter(Boolean);
    let scriptureRef = "";
    let title = `${MONTHS[month - 1]} ${day}`;
    const content = pageText.trim();

    // Look for scripture pattern in first 200 chars
    const refMatch = content.substring(0, 200).match(/([1-3]?\s?[A-Z][a-z]+\.?\s+\d+:\d+(?:-\d+)?)/);
    if (refMatch) {
      scriptureRef = refMatch[1];
    }

    entries.push({ month, day, title, scriptureRef, content });
  }

  return entries;
}

/**
 * Parse the Puritan Catechism into Q&A entries.
 */
function parseCatechism(fullText: string): { questionNumber: number; question: string; answer: string; scriptureRefs: string[] }[] {
  const entries: { questionNumber: number; question: string; answer: string; scriptureRefs: string[] }[] = [];

  // Actual PDF format: "Question 1.  What is the chief end of man?  ANSWER.   Man's chief end is..."
  // Split on "Question N." pattern
  const matches = fullText.split(/Question\s+(\d+)\.\s*/i);

  for (let i = 1; i < matches.length; i += 2) {
    const num = parseInt(matches[i], 10);
    const rest = matches[i + 1] ?? "";

    // Split on "ANSWER." to separate question from answer
    const aParts = rest.split(/ANSWER\.\s*/i);
    const question = aParts[0]?.trim() ?? "";
    const answer = aParts.slice(1).join(" ").trim();

    if (question && num) {
      // Extract scripture refs like (Gen. 1:1), (1 Cor. 10:31), etc.
      const refs: string[] = [];
      const refMatches = answer.matchAll(/\(([1-3]?\s?[A-Z][a-z]+\.?\s+\d+:\d+(?:-\d+)?)\)/g);
      for (const m of refMatches) {
        refs.push(m[1]);
      }

      entries.push({
        questionNumber: num,
        question,
        answer: answer.substring(0, 5000),
        scriptureRefs: refs.slice(0, 10),
      });
    }
  }

  return entries;
}

// ============================================
// Main Seed Function
// ============================================
async function seed() {
  for (const book of LIBRARY_BOOKS) {
    const filePath = path.resolve(process.cwd(), book.file);

    if (!fs.existsSync(filePath)) {
      console.log(`[ETL] ⚠️  Skipping ${book.file} — file not found`);
      continue;
    }

    console.log(`\n[ETL] Processing: ${book.title} (${book.file})...`);
    const pages = await extractTextFromPDF(filePath);
    console.log(`[ETL] Extracted ${pages.length} pages`);

    // Insert book metadata
    const bookResult = await sql`
      INSERT INTO library_books (id, slug, title, author, book_type, description)
      VALUES (gen_random_uuid(), ${book.slug}, ${book.title}, ${book.author}, ${book.bookType}, ${book.description})
      ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
      RETURNING id
    `;
    const bookId = bookResult[0].id as string;
    console.log(`[ETL] Book ID: ${bookId}`);

    if (book.bookType === "devotional") {
      // Parse as daily devotional
      const entries = parseDevotional(pages);
      console.log(`[ETL] Parsed ${entries.length} devotional entries`);

      const BATCH = 10;
      for (let i = 0; i < entries.length; i += BATCH) {
        const batch = entries.slice(i, i + BATCH);
        await Promise.all(
          batch.map((e) =>
            sql`
              INSERT INTO devotional_entries (id, book_id, month, day, title, scripture_ref, content)
              VALUES (gen_random_uuid(), ${bookId}, ${e.month}, ${e.day}, ${e.title}, ${e.scriptureRef}, ${e.content})
              ON CONFLICT (book_id, month, day) DO NOTHING
            `
          )
        );
      }
      console.log(`[ETL] ✓ Inserted ${entries.length} devotional entries`);

    } else if (book.bookType === "catechism") {
      // Parse as catechism Q&A
      const fullText = pages.join("\n");
      const entries = parseCatechism(fullText);
      console.log(`[ETL] Parsed ${entries.length} catechism entries`);

      for (const e of entries) {
        await sql`
          INSERT INTO catechism_entries (id, book_id, question_number, question, answer, scripture_refs)
          VALUES (gen_random_uuid(), ${bookId}, ${e.questionNumber}, ${e.question}, ${e.answer}, ${e.scriptureRefs})
          ON CONFLICT (book_id, question_number) DO NOTHING
        `;
      }
      console.log(`[ETL] ✓ Inserted ${entries.length} catechism entries`);

    } else {
      // Book or prayers — chunk into chapters
      const chapters = chunkPages(pages, book.bookType === "prayers" ? 3 : 5);
      console.log(`[ETL] Chunked into ${chapters.length} chapters`);

      const BATCH = 5;
      for (let i = 0; i < chapters.length; i += BATCH) {
        const batch = chapters.slice(i, i + BATCH);
        await Promise.all(
          batch.map((ch, j) =>
            sql`
              INSERT INTO library_chapters (id, book_id, chapter_number, title, content)
              VALUES (gen_random_uuid(), ${bookId}, ${i + j + 1}, ${ch.title}, ${ch.content})
              ON CONFLICT (book_id, chapter_number) DO NOTHING
            `
          )
        );
      }
      console.log(`[ETL] ✓ Inserted ${chapters.length} chapters`);
    }
  }

  // Summary
  const bookCount = await sql`SELECT COUNT(*)::int as total FROM library_books`;
  const chapterCount = await sql`SELECT COUNT(*)::int as total FROM library_chapters`;
  const devCount = await sql`SELECT COUNT(*)::int as total FROM devotional_entries`;
  const catCount = await sql`SELECT COUNT(*)::int as total FROM catechism_entries`;

  console.log(`\n[ETL] ✅ Library seeding complete!`);
  console.log(`  Books: ${bookCount[0].total}`);
  console.log(`  Chapters: ${chapterCount[0].total}`);
  console.log(`  Devotionals: ${devCount[0].total}`);
  console.log(`  Catechism Q&A: ${catCount[0].total}`);
}

seed().catch((err) => {
  console.error("[ETL] Fatal error:", err);
  process.exit(1);
});
