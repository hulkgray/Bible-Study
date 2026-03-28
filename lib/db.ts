import { neon } from "@neondatabase/serverless";

/**
 * Returns a Neon serverless SQL client.
 * Uses template literal syntax for parameterized queries (SQL injection safe).
 *
 * Usage:
 *   const sql = getDbClient();
 *   const rows = await sql`SELECT * FROM bible_verses WHERE book_number = ${1}`;
 */
export function getDbClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "[DB] DATABASE_URL is not configured. Add it via Vercel environment variables."
    );
  }
  return neon(databaseUrl);
}
