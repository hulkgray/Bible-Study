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

async function main() {
  console.log("Creating webster_1828 table...");
  
  await sql`CREATE TABLE IF NOT EXISTS webster_1828 (
    id SERIAL PRIMARY KEY,
    word VARCHAR(255) NOT NULL,
    content TEXT NOT NULL
  )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_webster_1828_word ON webster_1828(word)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_webster_1828_word_upper ON webster_1828(UPPER(word))`;

  console.log("✅ webster_1828 table + indexes created");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
