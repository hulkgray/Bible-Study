/**
 * seed-strongs.ts — ETL script to parse Strong's Greek & Hebrew concordance PDFs.
 *
 * Parses sgreek.pdf and shebrew.pdf into strongs_entries table.
 *
 * Usage: npx tsx scripts/seed-strongs.ts
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

async function extractTextFromPDF(filePath: string): Promise<string> {
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

  return pages.join("\n");
}

interface StrongsEntry {
  strongsNumber: string;
  language: "greek" | "hebrew";
  originalWord: string;
  transliteration: string;
  pronunciation: string;
  definition: string;
}

/**
 * Parse Strong's concordance text into structured entries.
 * Strong's entries typically follow a pattern like:
 *   NUMBER. original_word transliteration; pronunciation; definition
 */
function parseStrongsEntries(text: string, language: "greek" | "hebrew", prefix: string): StrongsEntry[] {
  const entries: StrongsEntry[] = [];

  // Try to match patterns like "1234" or "1234." followed by content
  // Strong's numbers range from 1 to ~8849 (Hebrew) or ~5624 (Greek)
  const pattern = new RegExp(`(?:^|\\s)(\\d{1,4})[\\.\\s]+(.+?)(?=(?:^|\\s)\\d{1,4}[\\.\\s]|$)`, "gs");

  let match;
  while ((match = pattern.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    const content = match[2].trim();

    if (num < 1 || num > 9999 || content.length < 5) continue;

    const strongsNumber = `${prefix}${num}`;

    // Try to extract parts from the content
    // Format varies but typically: "original transliteration; pronunciation; definition"
    const parts = content.split(/[;—–]/);
    const originalWord = parts[0]?.trim()?.substring(0, 100) ?? "";
    const transliteration = parts[1]?.trim()?.substring(0, 100) ?? "";
    const pronunciation = parts[2]?.trim()?.substring(0, 100) ?? "";
    const definition = parts.slice(1).join("; ").trim() || content;

    entries.push({
      strongsNumber,
      language,
      originalWord,
      transliteration,
      pronunciation,
      definition: definition.substring(0, 5000),
    });
  }

  return entries;
}

async function seed() {
  const files: { file: string; language: "greek" | "hebrew"; prefix: string }[] = [
    { file: "sgreek.pdf", language: "greek", prefix: "G" },
    { file: "shebrew.pdf", language: "hebrew", prefix: "H" },
  ];

  let totalEntries = 0;

  for (const { file, language, prefix } of files) {
    const filePath = path.resolve(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      console.log(`[ETL] ⚠️  Skipping ${file} — file not found`);
      continue;
    }

    console.log(`\n[ETL] Processing: ${file} (${language})...`);
    const text = await extractTextFromPDF(filePath);
    console.log(`[ETL] Extracted ${text.length} characters`);

    const entries = parseStrongsEntries(text, language, prefix);
    console.log(`[ETL] Parsed ${entries.length} ${language} entries`);

    if (entries.length === 0) {
      console.log(`[ETL] ⚠️  No entries found — PDF format may need custom parsing`);
      continue;
    }

    // Show samples
    console.log(`[ETL] First 3 entries:`);
    entries.slice(0, 3).forEach((e) =>
      console.log(`  ${e.strongsNumber}: ${e.originalWord} — ${e.definition.substring(0, 80)}...`)
    );

    // Insert with concurrency
    const BATCH_SIZE = 25;
    let inserted = 0;

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map((e) =>
          sql`
            INSERT INTO strongs_entries (id, strongs_number, language, original_word, transliteration, pronunciation, definition)
            VALUES (gen_random_uuid(), ${e.strongsNumber}, ${e.language}, ${e.originalWord}, ${e.transliteration}, ${e.pronunciation}, ${e.definition})
            ON CONFLICT (strongs_number) DO NOTHING
          `
        )
      );

      inserted += batch.length;
      if (inserted % 500 === 0 || i + BATCH_SIZE >= entries.length) {
        console.log(`[ETL] Inserted ${inserted} / ${entries.length}`);
      }
    }

    totalEntries += inserted;
  }

  // Verify
  const countResult = await sql`SELECT COUNT(*)::int as total FROM strongs_entries`;
  console.log(`\n[ETL] ✅ Done! Total Strong's entries: ${countResult[0].total}`);

  // Spot checks
  const greekSample = await sql`
    SELECT strongs_number, original_word, definition FROM strongs_entries
    WHERE strongs_number = 'G25'
  `;
  if (greekSample.length > 0) {
    console.log(`[ETL] ✓ Greek spot check: G25 = ${greekSample[0].original_word}`);
  }

  const hebrewSample = await sql`
    SELECT strongs_number, original_word, definition FROM strongs_entries
    WHERE strongs_number = 'H430'
  `;
  if (hebrewSample.length > 0) {
    console.log(`[ETL] ✓ Hebrew spot check: H430 = ${hebrewSample[0].original_word}`);
  }
}

seed().catch((err) => {
  console.error("[ETL] Fatal error:", err);
  process.exit(1);
});
