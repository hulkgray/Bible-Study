import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("=== Cleaning up mangled Easton's entries ===\n");

  // Delete entries where headword ends with a doubled letter (our script bug)
  // e.g., "Aaronn", "Davidd", "Guidedd"
  const doubled = await sql`
    DELETE FROM dictionary_entries
    WHERE RIGHT(headword, 2) = REPEAT(RIGHT(headword, 1), 2)
      AND RIGHT(headword, 1) ~ '[a-z]'
      AND headword != headword  -- impossible, just for safety
  `;

  // Actually, let's be more surgical — delete where headword has double final letter  
  // AND there exists another entry with the same headword minus the last char
  const mangled = await sql`
    DELETE FROM dictionary_entries
    WHERE id IN (
      SELECT d.id FROM dictionary_entries d
      WHERE RIGHT(d.headword, 2) = REPEAT(RIGHT(d.headword, 1), 2)
        AND LENGTH(d.headword) > 3
        AND RIGHT(d.headword, 1) ~ '[a-z]'
    )
    RETURNING headword
  `;
  console.log(`Deleted ${mangled.length} entries with doubled final letters`);
  for (const m of mangled.slice(0, 10)) {
    console.log(`  - ${m.headword}`);
  }

  // Delete entries that are clearly not dictionary headwords
  // (common English words that were picked up from PDF mid-sentence)
  const commonWords = [
    'The', 'They', 'This', 'That', 'These', 'Those', 'There',
    'His', 'Her', 'Its', 'Our', 'Their',
    'But', 'And', 'For', 'With', 'From', 'One', 'Some', 'Many',
    'When', 'While', 'Where', 'Which', 'What', 'How',
    'Heb', 'Deut', 'Figs', 'Latter', 'Recently', 'Lest',
    'Passing', 'Guided', 'Hearing', 'Twenty',
    'Thee', 'Thatt', 'Theyy', 'Hiss', 'Itss', 'Thiss', 'Twentyy',
    'Guidedd', 'Hearingg', 'Hittitess',
  ];
  
  for (const word of commonWords) {
    await sql`DELETE FROM dictionary_entries WHERE headword = ${word}`;
  }
  console.log(`\nDeleted common-word false positives`);

  // Delete entries with very short definitions (< 20 chars)
  const shortDefs = await sql`
    DELETE FROM dictionary_entries
    WHERE LENGTH(definition) < 20
    RETURNING headword
  `;
  console.log(`Deleted ${shortDefs.length} entries with very short definitions`);

  // Final count and verification
  const [count] = await sql`SELECT COUNT(*)::int as cnt FROM dictionary_entries`;
  console.log(`\n✅ Final Easton's entry count: ${count.cnt}`);

  console.log("\n=== Sample entries ===");
  const samples = await sql`
    SELECT headword, LEFT(definition, 80) as preview
    FROM dictionary_entries
    WHERE headword IN ('Aaron', 'Moses', 'David', 'Jerusalem', 'Abraham', 'Isaiah', 'Paul', 'Peter')
    ORDER BY headword
  `;
  for (const s of samples) {
    console.log(`  ${s.headword}: ${s.preview}...`);
  }
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
