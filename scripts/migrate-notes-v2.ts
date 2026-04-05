/**
 * migrate-notes-v2.ts
 * Adds slug + share_mode columns to study_notes.
 * Backfills slugs for all existing notes.
 * Usage: npx tsx scripts/migrate-notes-v2.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

function generateSlug(): string {
  return crypto.randomBytes(6).toString("base64url"); // 8 chars, URL-safe
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log("[Migration] Notes V2: slug + share_mode\n");

  // 1. Add slug column
  await sql`ALTER TABLE study_notes ADD COLUMN IF NOT EXISTS slug VARCHAR(12)`;
  console.log("✅ study_notes.slug column added");

  // 2. Add unique index on slug
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_slug ON study_notes(slug)`;
  console.log("✅ study_notes.slug unique index created");

  // 3. Add share_mode column
  await sql`ALTER TABLE study_notes ADD COLUMN IF NOT EXISTS share_mode VARCHAR(20) NOT NULL DEFAULT 'private'`;
  console.log("✅ study_notes.share_mode column added");

  // 4. Backfill slugs for existing notes that don't have one
  const existing = await sql`SELECT id FROM study_notes WHERE slug IS NULL`;
  console.log(`\n📝 Backfilling slugs for ${existing.length} notes...`);

  for (const row of existing) {
    const slug = generateSlug();
    await sql`UPDATE study_notes SET slug = ${slug} WHERE id = ${row.id}`;
    console.log(`  → ${row.id} → ${slug}`);
  }

  // 5. Now make slug NOT NULL after backfill
  await sql`ALTER TABLE study_notes ALTER COLUMN slug SET NOT NULL`;
  console.log("\n✅ study_notes.slug set to NOT NULL");

  console.log("\n✅ Notes V2 migration complete!");
}

main().catch((e) => {
  console.error("[Migration] Fatal error:", e);
  process.exit(1);
});
