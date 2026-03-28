/**
 * seed-bibles.ts — ETL script to parse bibles.xlsx and insert into Neon.
 *
 * Parses 31,103 rows × 10 translation columns from the Excel file,
 * then batch-inserts into the bible_verses table.
 *
 * Usage: npx tsx scripts/seed-bibles.ts
 */
import ExcelJS from "exceljs";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL not found in .env.local");
}

const sql = neon(DATABASE_URL);

/**
 * Column mapping: XLSX column index → translation code
 * Column 0 = "Book Chapter:Verse" (reference)
 * Columns 1-10 = translation texts
 */
const COLUMN_MAP: Record<number, string> = {
  1: "kjv",
  2: "asv",
  3: "drb",
  4: "dbt",
  5: "erv",
  6: "wbt",
  7: "web",
  8: "ylt",
  9: "akjv",
  10: "wnt",
};

/** Map book names from the XLSX to canonical slugs and numbers */
const BOOK_NAME_MAP: Record<string, { bookNumber: number; canonical: string }> = {};

// Build the map from the canonical list
const BOOKS = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles",
  "Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes",
  "Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel",
  "Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk",
  "Zephaniah","Haggai","Zechariah","Malachi",
  "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians",
  "Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians",
  "1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James",
  "1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
];

BOOKS.forEach((name, i) => {
  BOOK_NAME_MAP[name.toLowerCase()] = { bookNumber: i + 1, canonical: name };
  // Also handle common abbreviations from the XLSX
});

// Add common XLSX abbreviations
const ALIASES: Record<string, string> = {
  "psalm": "psalms",
  "song of songs": "song of solomon",
  "songs of solomon": "song of solomon",
  "canticles": "song of solomon",
  "revelation of john": "revelation",
  "apocalypse": "revelation",
};

for (const [alias, canonical] of Object.entries(ALIASES)) {
  if (BOOK_NAME_MAP[canonical]) {
    BOOK_NAME_MAP[alias] = BOOK_NAME_MAP[canonical];
  }
}

function parseReference(ref: string): { book: string; chapter: number; verse: number } | null {
  if (!ref || typeof ref !== "string") return null;

  // Format: "Book Chapter:Verse" — e.g., "Genesis 1:1" or "1 Samuel 3:12"
  const match = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return null;

  const bookName = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const verse = parseInt(match[3], 10);

  if (isNaN(chapter) || isNaN(verse)) return null;

  return { book: bookName, chapter, verse };
}

async function seed() {
  const filePath = path.resolve(process.cwd(), "bibles.xlsx");
  console.log(`[ETL] Reading ${filePath}...`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("No worksheet found in bibles.xlsx");
  }

  console.log(`[ETL] Found sheet: "${sheet.name}" with ${sheet.rowCount} rows`);

  // Collect all verse data
  interface VerseRow {
    book: string;
    bookNumber: number;
    chapter: number;
    verse: number;
    translationCode: string;
    text: string;
  }

  const allVerses: VerseRow[] = [];
  let skippedRows = 0;
  let headerRow = true;

  sheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (headerRow) {
      headerRow = false;
      console.log(`[ETL] Header row: ${row.values}`);
      return;
    }

    const refCell = row.getCell(1).value?.toString() ?? "";
    const parsed = parseReference(refCell);

    if (!parsed) {
      skippedRows++;
      if (skippedRows <= 5) {
        console.log(`[ETL] Skipped row ${rowNumber}: "${refCell}"`);
      }
      return;
    }

    const lookupKey = parsed.book.toLowerCase();
    const bookInfo = BOOK_NAME_MAP[lookupKey];

    if (!bookInfo) {
      // Try partial match
      const partialKey = Object.keys(BOOK_NAME_MAP).find((k) =>
        lookupKey.startsWith(k) || k.startsWith(lookupKey)
      );
      if (!partialKey) {
        if (skippedRows <= 10) {
          console.log(`[ETL] Unknown book: "${parsed.book}" at row ${rowNumber}`);
        }
        skippedRows++;
        return;
      }
    }

    const info = bookInfo ?? BOOK_NAME_MAP[Object.keys(BOOK_NAME_MAP).find((k) =>
      lookupKey.startsWith(k) || k.startsWith(lookupKey)
    )!];

    // Extract each translation column
    for (const [colIdx, translationCode] of Object.entries(COLUMN_MAP)) {
      const cellValue = row.getCell(parseInt(colIdx) + 1).value;
      const text = cellValue?.toString()?.trim();

      if (text && text.length > 0) {
        allVerses.push({
          book: info.canonical,
          bookNumber: info.bookNumber,
          chapter: parsed.chapter,
          verse: parsed.verse,
          translationCode,
          text,
        });
      }
    }
  });

  console.log(`[ETL] Parsed ${allVerses.length} verse entries (${skippedRows} rows skipped)`);

  if (allVerses.length === 0) {
    throw new Error("No verses parsed — check XLSX format");
  }

  // Insert using tagged template literals with controlled concurrency.
  // Reduced to 15 concurrent to avoid Neon connection pool exhaustion.
  // ON CONFLICT DO NOTHING makes reruns safe (idempotent).
  const BATCH_SIZE = 15;
  let inserted = 0;

  async function insertWithRetry(v: typeof allVerses[0], retries = 3): Promise<void> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await sql`
          INSERT INTO bible_verses (id, book, book_number, chapter, verse, translation_code, text)
          VALUES (gen_random_uuid(), ${v.book}, ${v.bookNumber}, ${v.chapter}, ${v.verse}, ${v.translationCode}, ${v.text})
          ON CONFLICT (book_number, chapter, verse, translation_code) DO NOTHING
        `;
        return;
      } catch (err) {
        if (attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw err;
        }
      }
    }
  }

  for (let i = 0; i < allVerses.length; i += BATCH_SIZE) {
    const batch = allVerses.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map((v) => insertWithRetry(v)));

    inserted += batch.length;
    if (inserted % 5000 === 0 || i + BATCH_SIZE >= allVerses.length) {
      console.log(`[ETL] Inserted ${inserted} / ${allVerses.length} (${Math.round((inserted / allVerses.length) * 100)}%)`);
    }
  }


  // Verify
  const countResult = await sql`SELECT COUNT(*)::int as total FROM bible_verses`;
  console.log(`\n[ETL] ✅ Done! Total verses in database: ${countResult[0].total}`);

  // Spot check
  const sample = await sql`
    SELECT book, chapter, verse, translation_code, text 
    FROM bible_verses 
    WHERE book = 'Genesis' AND chapter = 1 AND verse = 1 AND translation_code = 'kjv'
  `;
  if (sample.length > 0) {
    console.log(`[ETL] ✓ Spot check: Genesis 1:1 (KJV) = "${sample[0].text.substring(0, 80)}..."`);
  }
}

seed().catch((err) => {
  console.error("[ETL] Fatal error:", err);
  process.exit(1);
});
