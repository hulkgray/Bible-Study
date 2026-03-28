/**
 * Import Webster's 1828 Dictionary from DataWar/1828-dictionary GitHub repo.
 *
 * The SQL dump is MySQL INSERT INTO format with HTML content:
 * (id, 'word', length, 'old_html', 'slug', 'Heading', 'modern_html'),
 *
 * We extract `heading` (field 6) and `content` (field 7, modern HTML)
 * and strip HTML tags to store plain text.
 *
 * Usage:  node scripts/import-webster-1828.mjs
 */

import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set in .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const INSERT_SQL_URL =
  "https://raw.githubusercontent.com/DataWar/1828-dictionary/main/v2015/SQL/02-database-insert/dictionary_webster1828.sql";

/**
 * Strip HTML tags and decode basic entities.
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .trim();
}

/**
 * Parse a MySQL VALUES row like:
 *   (1, 'word', 3, 'old_html', 'slug', 'Heading', 'modern_html'),
 *
 * Returns { heading, content } or null.
 */
function parseRow(line) {
  // Remove leading ( and trailing ), or );
  let trimmed = line.trim();
  if (trimmed.startsWith("(")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("),")) trimmed = trimmed.slice(0, -2);
  else if (trimmed.endsWith(");")) trimmed = trimmed.slice(0, -2);
  else if (trimmed.endsWith(")")) trimmed = trimmed.slice(0, -1);

  // Extract 7 fields by parsing quoted strings
  // Fields: id(int), word(str), length(int), string(str), _word(str), heading(str), content(str)
  const fields = [];
  let i = 0;

  while (i < trimmed.length && fields.length < 7) {
    // Skip whitespace and commas
    while (i < trimmed.length && (trimmed[i] === " " || trimmed[i] === ",")) i++;
    if (i >= trimmed.length) break;

    if (trimmed[i] === "'") {
      // Quoted string field
      i++; // skip opening quote
      let value = "";
      while (i < trimmed.length) {
        if (trimmed[i] === "\\") {
          // Escaped character
          if (i + 1 < trimmed.length) {
            value += trimmed[i] + trimmed[i + 1];
            i += 2;
          } else {
            i++;
          }
        } else if (trimmed[i] === "'") {
          // Check for '' (escaped quote in MySQL)
          if (i + 1 < trimmed.length && trimmed[i + 1] === "'") {
            value += "'";
            i += 2;
          } else {
            // End of quoted string
            i++; // skip closing quote
            break;
          }
        } else {
          value += trimmed[i];
          i++;
        }
      }
      fields.push(value);
    } else {
      // Unquoted field (number)
      let value = "";
      while (i < trimmed.length && trimmed[i] !== "," && trimmed[i] !== " ") {
        value += trimmed[i];
        i++;
      }
      fields.push(value);
    }
  }

  if (fields.length < 7) return null;

  const heading = fields[5]; // 'Heading'
  const content = fields[6]; // modern HTML content

  // Skip "Did you mean" entries
  if (heading === "Did you mean one of these words?") return null;
  if (!heading || !content) return null;

  return {
    word: heading.trim(),
    content: stripHtml(content),
  };
}

async function main() {
  console.log("📖 Fetching Webster's 1828 dictionary SQL from GitHub...");

  const response = await fetch(INSERT_SQL_URL);
  if (!response.ok) {
    console.error(`❌ Failed to fetch: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const rawText = await response.text();
  const lines = rawText.split("\n");

  console.log(`📄 Downloaded ${lines.length} lines. Parsing INSERT rows...`);

  const entries = [];
  for (const line of lines) {
    // Skip INSERT INTO header lines and empty/comment lines
    if (line.startsWith("INSERT INTO") || line.startsWith("--") || !line.trim()) continue;
    // Must start with '(' to be a data row
    if (!line.trim().startsWith("(")) continue;

    const parsed = parseRow(line);
    if (parsed && parsed.word && parsed.content && parsed.content.length > 5) {
      entries.push(parsed);
    }
  }

  console.log(`✅ Parsed ${entries.length} dictionary entries.`);

  if (entries.length === 0) {
    console.error("❌ No entries parsed. Check the SQL format.");
    console.log("Sample line:", lines[6]?.substring(0, 200));
    process.exit(1);
  }

  // Show a sample
  console.log(`📝 Sample entry: "${entries[0].word}" → ${entries[0].content.substring(0, 100)}...`);

  // Deduplicate by word (keep longest definition)
  const wordMap = new Map();
  for (const entry of entries) {
    const key = entry.word.toUpperCase();
    const existing = wordMap.get(key);
    if (!existing || entry.content.length > existing.content.length) {
      wordMap.set(key, entry);
    }
  }

  const uniqueEntries = Array.from(wordMap.values());
  console.log(`📊 ${uniqueEntries.length} unique entries after dedup.`);

  // Insert in batches
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < uniqueEntries.length; i += BATCH_SIZE) {
    const batch = uniqueEntries.slice(i, i + BATCH_SIZE);

    try {
      for (const entry of batch) {
        await sql`
          INSERT INTO webster_1828 (word, content)
          VALUES (${entry.word}, ${entry.content})
          ON CONFLICT DO NOTHING
        `;
      }
      inserted += batch.length;

      if (inserted % 1000 === 0 || i + BATCH_SIZE >= uniqueEntries.length) {
        console.log(`  ✏️  Inserted ${inserted} / ${uniqueEntries.length}...`);
      }
    } catch (err) {
      console.error(`❌ Batch error at offset ${i}:`, err.message);
    }
  }

  console.log(`\n✅ Done! Inserted ${inserted} Webster's 1828 entries.`);

  const [row] = await sql`SELECT COUNT(*) as cnt FROM webster_1828`;
  console.log(`📊 Total rows in webster_1828: ${row.cnt}`);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
