/**
 * migrate-auth.ts
 * Creates users table and adds user_id to user-owned tables.
 * Usage: npx tsx scripts/migrate-auth.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log("[Migration] Phase 3A: User Authentication\n");

  // 1. Create users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(320) NOT NULL UNIQUE,
      name VARCHAR(200) NOT NULL,
      password_hash TEXT NOT NULL,
      profile_picture_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log("✅ users table created");

  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
  console.log("✅ users email index created");

  // 2. Add user_id to bookmarks
  await sql`ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)`;
  console.log("✅ bookmarks.user_id added");

  await sql`CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id)`;
  console.log("✅ bookmarks user index created");

  // 3. Add user_id to study_notes
  await sql`ALTER TABLE study_notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)`;
  console.log("✅ study_notes.user_id added");

  await sql`CREATE INDEX IF NOT EXISTS idx_notes_user ON study_notes(user_id)`;
  console.log("✅ study_notes user index created");

  // 4. Add user_id to note_folders
  await sql`ALTER TABLE note_folders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)`;
  console.log("✅ note_folders.user_id added");

  await sql`CREATE INDEX IF NOT EXISTS idx_folders_user ON note_folders(user_id)`;
  console.log("✅ note_folders user index created");

  // 5. Add user_id to chat_sessions
  await sql`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)`;
  console.log("✅ chat_sessions.user_id added");

  await sql`CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id)`;
  console.log("✅ chat_sessions user index created");

  console.log("\n✅ All Phase 3A migrations complete!");
}

main().catch((e) => {
  console.error("[Migration] Fatal error:", e);
  process.exit(1);
});
