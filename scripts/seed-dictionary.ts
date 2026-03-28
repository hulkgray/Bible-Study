/**
 * seed-dictionary.ts — ETL script to parse Easton's Bible Dictionary PDF.
 *
 * Parses the PDF text, extracts headword/definition pairs,
 * and inserts into the dictionary_entries table.
 *
 * Usage: npx tsx scripts/seed-dictionary.ts
 */
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

// pdfjs-dist requires this polyfill in Node
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

function parseDictionaryEntries(fullText: string): { headword: string; definition: string }[] {
  const entries: { headword: string; definition: string }[] = [];

  // The PDF extracts as continuous text where headwords run directly into definitions.
  // Pattern: "HeadwordDefinition text..." or "Headword-compoundDefinition text..."
  // Example: "Abarimregions beyond; i.e., on the east of Jordan..."
  // We detect transitions where a capitalized word is followed by lowercase text.
  //
  // Strategy: Split on patterns where we see a capitalized word (1-40 chars)
  // that transitions to a lowercase definition. Handle hyphenated headwords too.
  // Example matches: "Abel-beth-maachahmeadow of the house..."

  const pattern = /(?:^|(?<=\.[\s)]))((?:[A-Z][a-z]+(?:[-'][a-z]+)*(?:\s(?:[A-Z][a-z]+|of|the|and|in))*))(?=[a-z,\(])/g;

  // Simpler approach: split the full text by known headword patterns
  // Headwords in Easton's are typically are Title-Case words like:
  // "Aaron", "Abel", "Abel-beth-maachah", "Abi-albon"
  // They appear before a lowercase definition.
  
  // Use a two-pass approach:
  // 1. Find all potential headword positions
  // 2. Extract text between them as definitions

  // Regex: A capitalized word (possibly hyphenated) where:
  // - preceded by a period+space, a newline, or a close-paren
  // - followed by a lowercase letter (start of definition)
  const headwordPattern = /(?:(?<=\.\s)|(?<=\)\s)|(?<=\n)|(?<=\.\n))([A-Z][a-z]{1,25}(?:[-][a-z]+)*(?:[-][A-Z][a-z]+)*)(?=[a-z(,])/g;

  const headwordPositions: { word: string; index: number }[] = [];
  let match;

  while ((match = headwordPattern.exec(fullText)) !== null) {
    const word = match[1];
    // Filter out common false positives
    if (word.length >= 2 && word.length <= 40) {
      headwordPositions.push({ word, index: match.index });
    }
  }

  console.log(`[ETL] Found ${headwordPositions.length} potential headword positions`);

  // Extract definitions between headword positions
  for (let i = 0; i < headwordPositions.length; i++) {
    const current = headwordPositions[i];
    const next = headwordPositions[i + 1];
    
    const defStart = current.index + current.word.length;
    const defEnd = next ? next.index : fullText.length;
    const definition = fullText.substring(defStart, defEnd).trim();

    // Only keep entries with meaningful definitions (> 20 chars)
    if (definition.length > 20) {
      entries.push({
        headword: current.word,
        definition: definition.substring(0, 10000), // Cap at reasonable size
      });
    }
  }

  // Deduplicate by headword (keep first occurrence)
  const seen = new Set<string>();
  const deduped = entries.filter((e) => {
    const key = e.headword.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped;
}

async function seed() {
  const filePath = path.resolve(process.cwd(), "eastons_bible_dictionary.pdf");
  console.log(`[ETL] Reading ${filePath}...`);

  const fullText = await extractTextFromPDF(filePath);
  console.log(`[ETL] Extracted ${fullText.length} characters from PDF`);

  const entries = parseDictionaryEntries(fullText);
  console.log(`[ETL] Parsed ${entries.length} dictionary entries`);

  if (entries.length === 0) {
    throw new Error("No entries parsed — check PDF format");
  }

  // Show first few entries for debugging
  console.log(`[ETL] First 5 entries:`);
  entries.slice(0, 5).forEach((e) =>
    console.log(`  - ${e.headword}: ${e.definition.substring(0, 80)}...`)
  );

  // Insert with concurrency
  const BATCH_SIZE = 25;
  let inserted = 0;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map((e) =>
        sql`
          INSERT INTO dictionary_entries (id, headword, definition)
          VALUES (gen_random_uuid(), ${e.headword}, ${e.definition})
        `
      )
    );

    inserted += batch.length;
    if (inserted % 500 === 0 || i + BATCH_SIZE >= entries.length) {
      console.log(`[ETL] Inserted ${inserted} / ${entries.length}`);
    }
  }

  // Verify
  const countResult = await sql`SELECT COUNT(*)::int as total FROM dictionary_entries`;
  console.log(`\n[ETL] ✅ Done! Total dictionary entries: ${countResult[0].total}`);

  // Spot check
  const sample = await sql`
    SELECT headword, definition FROM dictionary_entries
    WHERE headword ILIKE 'aaron%'
    LIMIT 1
  `;
  if (sample.length > 0) {
    console.log(`[ETL] ✓ Spot check: ${sample[0].headword} = "${(sample[0].definition as string).substring(0, 100)}..."`);
  }
}

seed().catch((err) => {
  console.error("[ETL] Fatal error:", err);
  process.exit(1);
});
