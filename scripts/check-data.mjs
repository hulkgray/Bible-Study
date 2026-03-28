import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("=== Fixing Strong's Data ===\n");

  // 1. Delete preamble/metadata entries (H1-H5, G1-G5)
  // These contain introduction text, not actual word definitions
  const preamble = await sql`
    DELETE FROM strongs_entries
    WHERE (strongs_number IN ('H1', 'H2', 'H3', 'H4', 'H5', 'G1', 'G2', 'G3', 'G4', 'G5'))
      AND (definition LIKE 'All the original words%'
           OR definition LIKE 'Immediately after%'
           OR definition LIKE 'Next follows the precise%'
           OR definition LIKE 'Then ensues%'
           OR definition LIKE 'In the case of proper%'
           OR definition LIKE 'By JAMES STRONG%'
           OR original_word LIKE 'All the original%'
           OR original_word LIKE 'Immediately after%'
           OR original_word LIKE 'Next follows%'
           OR original_word LIKE 'Then ensues%'
           OR original_word LIKE 'In the case%'
           OR original_word LIKE 'By JAMES STRONG%')
    RETURNING strongs_number
  `;
  console.log(`Deleted ${preamble.length} preamble entries: ${preamble.map(p => p.strongs_number).join(', ')}`);

  // 2. Check H430 — is it shifted?
  // H430 should be Elohim (אלהים). Let's check nearby entries.
  console.log("\n=== H425-H435 entries ===");
  const nearby = await sql`
    SELECT strongs_number, original_word, transliteration, LEFT(definition, 120) as def
    FROM strongs_entries
    WHERE strongs_number IN ('H425', 'H426', 'H427', 'H428', 'H429', 'H430', 'H431', 'H432', 'H433', 'H434', 'H435')
    ORDER BY CAST(SUBSTRING(strongs_number FROM 2) AS INTEGER)
  `;
  for (const r of nearby) {
    console.log(`  ${r.strongs_number}: word="${r.original_word}" trans="${r.transliteration}" def="${r.def}"`);
  }

  // 3. Check actual H1 (ab - father) after we deleted the preamble
  console.log("\n=== Checking if real H1 (ab/father) exists ===");
  const realH1 = await sql`
    SELECT strongs_number, original_word, transliteration, LEFT(definition, 100) as def
    FROM strongs_entries
    WHERE definition ILIKE '%father%'
      AND language = 'hebrew'
    ORDER BY CAST(SUBSTRING(strongs_number FROM 2) AS INTEGER)
    LIMIT 3
  `;
  for (const r of realH1) {
    console.log(`  ${r.strongs_number}: ${r.original_word} (${r.transliteration}) → ${r.def}`);
  }

  // 4. Count entries with empty/null original_word
  const missing = await sql`
    SELECT COUNT(*)::int as cnt FROM strongs_entries
    WHERE original_word IS NULL OR original_word = '' OR LENGTH(original_word) < 1
  `;
  console.log(`\nEntries missing original_word: ${missing[0].cnt}`);

  // 5. Final counts
  const total = await sql`SELECT COUNT(*)::int as cnt FROM strongs_entries`;
  const hebrew = await sql`SELECT COUNT(*)::int as cnt FROM strongs_entries WHERE language = 'hebrew'`;
  const greek = await sql`SELECT COUNT(*)::int as cnt FROM strongs_entries WHERE language = 'greek'`;
  console.log(`\n✅ Final Strong's count: ${total[0].cnt} (Hebrew: ${hebrew[0].cnt}, Greek: ${greek[0].cnt})`);
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
