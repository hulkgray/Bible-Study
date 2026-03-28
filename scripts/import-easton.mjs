import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
const sql = neon(process.env.DATABASE_URL);

const SOURCE_URL =
  "https://raw.githubusercontent.com/solancer/bible-dictionary-scraper/master/Dump/Bible_Dict_json_dump.json";

/**
 * Import Easton's Bible Dictionary from the GitHub JSON dump.
 *
 * The source is MongoDB-style BSON (with ObjectId wrappers), so we
 * pre-process it into valid JSON before parsing.
 *
 * Each entry has:
 *   { title: "Aaron", info: ["paragraph1", "paragraph2", ...] }
 *
 * We join the `info` array into a single definition string.
 */
async function main() {
  console.log("📖 Fetching Easton's Bible Dictionary JSON from GitHub...");
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  let rawText = await res.text();

  // Strip the markdown wrapper if present (the URL redirects to raw content)
  if (rawText.startsWith("Source:")) {
    // Remove the "Source: ... ---" header
    const jsonStart = rawText.indexOf("[");
    rawText = rawText.substring(jsonStart);
  }

  // Convert MongoDB ObjectId("...") to plain strings
  rawText = rawText.replace(/ObjectId\("([^"]+)"\)/g, '"$1"');

  console.log("📄 Parsing JSON...");
  const entries = JSON.parse(rawText);
  console.log(`✅ Parsed ${entries.length} dictionary entries.`);

  // Preview first few
  console.log("\n📝 Sample entries:");
  entries.slice(0, 3).forEach((e) => {
    console.log(`  "${e.title}" → ${e.info[0]?.substring(0, 80)}...`);
  });

  // Clear existing Easton's data and re-import
  console.log("\n🗑️  Clearing old dictionary_entries...");
  await sql`DELETE FROM dictionary_entries`;

  // Insert in batches
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map((e) => {
        const headword = (e.title || "").trim();
        // Join all info paragraphs into a single definition
        const definition = (e.info || [])
          .map((p) => (typeof p === "string" ? p.trim() : ""))
          .filter(Boolean)
          .join("\n\n");

        if (!headword || !definition) return Promise.resolve();

        return sql`
          INSERT INTO dictionary_entries (id, headword, definition)
          VALUES (gen_random_uuid(), ${headword}, ${definition})
        `;
      })
    );

    inserted += batch.length;
    if (inserted % 500 === 0 || i + BATCH_SIZE >= entries.length) {
      console.log(`  ✏️  Inserted ${inserted} / ${entries.length}...`);
    }
  }

  // Verify
  const [count] = await sql`SELECT COUNT(*)::int as cnt FROM dictionary_entries`;
  console.log(`\n✅ Done! Total Easton's entries: ${count.cnt}`);

  // Spot check
  const terms = ["Aaron", "Covenant", "Grace", "Mercy", "Faith", "Abraham", "Jerusalem", "Moses"];
  console.log("\n📋 Spot check:");
  for (const term of terms) {
    const rows = await sql`
      SELECT headword, LEFT(definition, 80) as preview
      FROM dictionary_entries
      WHERE headword ILIKE ${term}
      LIMIT 1
    `;
    if (rows.length > 0) {
      console.log(`  ✅ ${rows[0].headword}: ${rows[0].preview}...`);
    } else {
      console.log(`  ❌ "${term}" — NOT FOUND`);
    }
  }
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
