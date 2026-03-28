/**
 * seed-strongs-tags.ts
 * 
 * ETL: Fetches KJV with Strong's tags from kaiserlik/kjv GitHub repo
 * and updates the existing bible_verses rows with tagged_text.
 * 
 * Uses batch UPDATE FROM pattern: 1 query per book (66 total).
 * 
 * Usage: npx tsx scripts/seed-strongs-tags.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const BASE_URL = "https://raw.githubusercontent.com/kaiserlik/kjv/main";

const ABBREV_TO_BOOK: Record<string, string> = {
  Gen: "Genesis", Exo: "Exodus", Lev: "Leviticus", Num: "Numbers",
  Deu: "Deuteronomy", Jos: "Joshua", Jdg: "Judges", Rth: "Ruth",
  "1Sa": "1 Samuel", "2Sa": "2 Samuel", "1Ki": "1 Kings", "2Ki": "2 Kings",
  "1Ch": "1 Chronicles", "2Ch": "2 Chronicles", Ezr: "Ezra", Neh: "Nehemiah",
  Est: "Esther", Job: "Job", Psa: "Psalms", Pro: "Proverbs",
  Ecc: "Ecclesiastes", Sng: "Song of Solomon", Isa: "Isaiah", Jer: "Jeremiah",
  Lam: "Lamentations", Eze: "Ezekiel", Dan: "Daniel", Hos: "Hosea",
  Joe: "Joel", Amo: "Amos", Oba: "Obadiah", Jon: "Jonah",
  Mic: "Micah", Nah: "Nahum", Hab: "Habakkuk", Zep: "Zephaniah",
  Hag: "Haggai", Zec: "Zechariah", Mal: "Malachi",
  Mat: "Matthew", Mar: "Mark", Luk: "Luke", Jhn: "John",
  Act: "Acts", Rom: "Romans", "1Co": "1 Corinthians", "2Co": "2 Corinthians",
  Gal: "Galatians", Eph: "Ephesians", Phl: "Philippians", Col: "Colossians",
  "1Th": "1 Thessalonians", "2Th": "2 Thessalonians",
  "1Ti": "1 Timothy", "2Ti": "2 Timothy", Tit: "Titus", Phm: "Philemon",
  Heb: "Hebrews", Jas: "James", "1Pe": "1 Peter", "2Pe": "2 Peter",
  "1Jo": "1 John", "2Jo": "2 John", "3Jo": "3 John",
  Jde: "Jude", Rev: "Revelation",
};

const BOOK_ABBREVS = Object.keys(ABBREV_TO_BOOK);

/** Retry with exponential backoff */
async function withRetry<T>(fn: () => Promise<T>, retries = 4): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      if (attempt === retries) throw err;
      const delay = 3000 * Math.pow(2, attempt);
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`\n  ⚠ Retry ${attempt + 1}/${retries} after ${delay / 1000}s (${msg.slice(0, 80)})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  const existing = await withRetry(() =>
    sql`SELECT count(*) as cnt FROM bible_verses WHERE tagged_text IS NOT NULL`
  );
  const alreadyTagged = parseInt(existing[0].cnt as string, 10);

  console.log("[ETL] Strong's Tags Seeder");
  console.log(`[ETL] Already tagged: ${alreadyTagged} verses\n`);

  let totalUpdated = 0;

  for (const abbrev of BOOK_ABBREVS) {
    const dbBookName = ABBREV_TO_BOOK[abbrev];
    process.stdout.write(`[ETL] ${dbBookName} (${abbrev})...`);

    // Fetch JSON file
    const data = await withRetry(async () => {
      const res = await fetch(`${BASE_URL}/${abbrev}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });

    const bookData = data[abbrev];
    if (!bookData) { console.log(` ✗ No data`); continue; }

    // Collect all verse updates
    const updates: { chapter: number; verse: number; taggedText: string }[] = [];
    for (const chapterKey of Object.keys(bookData)) {
      const chapterNum = parseInt(chapterKey.split("|")[1], 10);
      const chapterData = bookData[chapterKey];
      for (const verseKey of Object.keys(chapterData)) {
        const verseNum = parseInt(verseKey.split("|")[2], 10);
        const enText = chapterData[verseKey].en || chapterData[verseKey].EN;
        if (enText) {
          updates.push({ chapter: chapterNum, verse: verseNum, taggedText: enText });
        }
      }
    }

    if (updates.length === 0) { console.log(` ✓ 0 verses`); continue; }

    // Process book in chapter-sized chunks to stay within query size limits
    // Group by chapter first
    const byChapter = new Map<number, typeof updates>();
    for (const u of updates) {
      if (!byChapter.has(u.chapter)) byChapter.set(u.chapter, []);
      byChapter.get(u.chapter)!.push(u);
    }

    let bookUpdated = 0;
    // Process 5 chapters at a time in a single query
    const chapters = Array.from(byChapter.entries());
    const BATCH = 5;

    for (let i = 0; i < chapters.length; i += BATCH) {
      const batch = chapters.slice(i, i + BATCH);
      const allUpdates = batch.flatMap(([, vs]) => vs);

      await withRetry(async () => {
        // Use individual updates but in a transaction-like batch
        // Neon serverless doesn't support transactions, so we just do them sequentially
        for (const u of allUpdates) {
          await sql`
            UPDATE bible_verses
            SET tagged_text = ${u.taggedText}
            WHERE translation_code = 'kjv'
              AND book = ${dbBookName}
              AND chapter = ${u.chapter}
              AND verse = ${u.verse}
          `;
        }
      });

      bookUpdated += allUpdates.length;
    }

    totalUpdated += bookUpdated;
    console.log(` ✓ ${updates.length} verses`);

    // Brief pause between books
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n[ETL] ✅ Complete! Total updated: ${totalUpdated}`);

  const verifyResult = await withRetry(() =>
    sql`SELECT count(*) as cnt FROM bible_verses WHERE tagged_text IS NOT NULL`
  );
  console.log(`  Verified: ${verifyResult[0].cnt} tagged verses in DB`);
}

main().catch((e) => {
  console.error("[ETL] Fatal error:", e);
  process.exit(1);
});
