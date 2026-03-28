/**
 * seed-apocrypha.ts — ETL for extra-biblical / deuterocanonical texts.
 *
 * Sources markdown files from the scrollmapper/bible_databases_deuterocanonical
 * GitHub repository (public domain). Parses them into library_books and
 * library_chapters.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const BASE_RAW_URL =
  "https://raw.githubusercontent.com/scrollmapper/bible_databases_deuterocanonical/master/sources/en";

interface ApocryphaBook {
  slug: string;
  title: string;
  author: string;
  category: string; // apocrypha, pseudepigrapha, dead-sea-scrolls, early-christian, lost-books
  folder: string;   // path under sources/en/
  file: string;     // markdown filename
}

const BOOKS: ApocryphaBook[] = [
  // ─── Apocrypha (Catholic deuterocanonical) ─────────────────
  { slug: "tobit", title: "Tobit", author: "Unknown", category: "apocrypha", folder: "book-of-tobit", file: "book-of-tobit.md" },
  { slug: "judith", title: "Judith", author: "Unknown", category: "apocrypha", folder: "book-of-judith", file: "book-of-judith.md" },
  { slug: "wisdom-of-solomon", title: "Wisdom of Solomon", author: "Unknown", category: "apocrypha", folder: "wisdom-of-solomon", file: "wisdom-of-solomon.md" },
  { slug: "sirach", title: "Sirach (Ecclesiasticus)", author: "Ben Sira", category: "apocrypha", folder: "book-of-sirach", file: "book-of-sirach.md" },
  { slug: "1-baruch", title: "1 Baruch", author: "Baruch ben Neriah", category: "apocrypha", folder: "1-baruch", file: "1-baruch.md" },
  { slug: "1-maccabees", title: "1 Maccabees", author: "Unknown", category: "apocrypha", folder: "1-maccabees", file: "1-maccabees.md" },
  { slug: "2-maccabees", title: "2 Maccabees", author: "Unknown", category: "apocrypha", folder: "2-maccabees", file: "2-maccabees.md" },
  { slug: "prayer-of-manasseh", title: "Prayer of Manasseh", author: "Unknown", category: "apocrypha", folder: "prayer-of-manasseh", file: "prayer-of-manasseh.md" },
  { slug: "susanna", title: "Susanna", author: "Unknown", category: "apocrypha", folder: "susanna", file: "susanna.md" },
  { slug: "bel-and-the-dragon", title: "Bel and the Dragon", author: "Unknown", category: "apocrypha", folder: "bel-and-the-dragon", file: "bel-and-the-dragon.md" },

  // ─── Pseudepigrapha ────────────────────────────────────────
  { slug: "1-enoch", title: "1 Enoch", author: "Attributed to Enoch", category: "pseudepigrapha", folder: "1-enoch", file: "1-enoch.md" },
  { slug: "2-enoch", title: "2 Enoch", author: "Attributed to Enoch", category: "pseudepigrapha", folder: "2-enoch", file: "2-enoch.md" },
  { slug: "jubilees", title: "Book of Jubilees", author: "Unknown", category: "pseudepigrapha", folder: "book-of-jubilees", file: "book-of-jubilees.md" },
  { slug: "testament-of-solomon", title: "Testament of Solomon", author: "Unknown", category: "pseudepigrapha", folder: "testament-of-solomon", file: "testament-of-solomon.md" },
  { slug: "psalms-of-solomon", title: "Psalms of Solomon", author: "Unknown", category: "pseudepigrapha", folder: "psalms-of-solomon", file: "psalms-of-solomon.md" },
  { slug: "odes-of-solomon", title: "Odes of Solomon", author: "Unknown", category: "pseudepigrapha", folder: "odes-of-solomon", file: "odes-of-solomon.md" },

  // ─── Lost Books ────────────────────────────────────────────
  { slug: "jasher", title: "Book of Jasher", author: "Unknown", category: "lost-books", folder: "book-of-jasher", file: "book-of-jasher.md" },
  { slug: "gad-the-seer", title: "Gad the Seer", author: "Attributed to Gad", category: "lost-books", folder: "gad-the-seer", file: "gad-the-seer.md" },

  // ─── Dead Sea Scrolls ──────────────────────────────────────
  { slug: "book-of-giants", title: "Book of Giants", author: "Unknown", category: "dead-sea-scrolls", folder: "book-of-giants", file: "book-of-giants.md" },

  // ─── Early Christian ───────────────────────────────────────
  { slug: "gospel-of-nicodemus", title: "Gospel of Nicodemus", author: "Unknown", category: "early-christian", folder: "gospel-of-nicodemus", file: "gospel-of-nicodemus.md" },
  { slug: "epistle-of-barnabas", title: "Epistle of Barnabas", author: "Pseudo-Barnabas", category: "early-christian", folder: "epistle-of-barnabas", file: "epistle-of-barnabas.md" },
];

/**
 * Download a raw markdown file from GitHub.
 */
async function fetchMarkdown(folder: string, file: string): Promise<string | null> {
  const url = `${BASE_RAW_URL}/${folder}/${file}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[ETL] ⚠️  Failed to fetch ${url}: ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`[ETL] ⚠️  Error fetching ${url}:`, err);
    return null;
  }
}

/**
 * Split markdown into chapters by heading (## or #).
 * Falls back to splitting by "Chapter N" patterns or large text blocks.
 */
function splitIntoChapters(md: string): { title: string; content: string }[] {
  const chapters: { title: string; content: string }[] = [];

  // Try splitting by ## headings first
  const headingRegex = /^#{1,3}\s+(.+)$/gm;
  const headings: { index: number; title: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(md)) !== null) {
    headings.push({ index: match.index, title: match[1].trim() });
  }

  if (headings.length >= 3) {
    // Use heading-based splitting
    for (let i = 0; i < headings.length; i++) {
      const start = headings[i].index;
      const end = i + 1 < headings.length ? headings[i + 1].index : md.length;
      const content = md.slice(start, end).trim();

      // Skip very short fragments (likely sub-headings)
      if (content.length < 30) continue;

      chapters.push({
        title: headings[i].title,
        content,
      });
    }
  } else {
    // Fallback: split into ~3000 char chunks as "sections"
    const CHUNK_SIZE = 3000;
    let sectionNum = 1;
    for (let i = 0; i < md.length; i += CHUNK_SIZE) {
      const chunk = md.slice(i, i + CHUNK_SIZE).trim();
      if (chunk.length < 50) continue;
      chapters.push({
        title: `Section ${sectionNum}`,
        content: chunk,
      });
      sectionNum++;
    }
  }

  return chapters;
}

// ============================================
// Main
// ============================================
async function seed() {
  console.log("[ETL] Starting Apocrypha seed...\n");

  let totalBooks = 0;
  let totalChapters = 0;

  for (const book of BOOKS) {
    console.log(`[ETL] Fetching: ${book.title}...`);
    const md = await fetchMarkdown(book.folder, book.file);

    if (!md) {
      console.log(`[ETL] ⚠️  Skipped ${book.title} — not found`);
      continue;
    }

    console.log(`[ETL]   → ${(md.length / 1024).toFixed(0)} KB of text`);

    // Upsert book
    const bookResult = await sql`
      INSERT INTO library_books (id, slug, title, author, book_type, description, category, source_url)
      VALUES (
        gen_random_uuid(),
        ${book.slug},
        ${book.title},
        ${book.author},
        ${"apocrypha"},
        ${`Extra-biblical text from the ${book.category} tradition.`},
        ${book.category},
        ${`https://github.com/scrollmapper/bible_databases_deuterocanonical/blob/master/sources/en/${book.folder}/${book.file}`}
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        source_url = EXCLUDED.source_url
      RETURNING id
    `;
    const bookId = bookResult[0].id as string;

    // Split into chapters
    const chapters = splitIntoChapters(md);
    console.log(`[ETL]   → ${chapters.length} chapters`);

    // Clear existing chapters for this book (idempotent re-run)
    await sql`DELETE FROM library_chapters WHERE book_id = ${bookId}`;

    // Insert chapters
    const BATCH = 5;
    for (let i = 0; i < chapters.length; i += BATCH) {
      const batch = chapters.slice(i, i + BATCH);
      await Promise.all(
        batch.map((ch, j) =>
          sql`
            INSERT INTO library_chapters (id, book_id, chapter_number, title, content)
            VALUES (gen_random_uuid(), ${bookId}, ${i + j + 1}, ${ch.title}, ${ch.content})
            ON CONFLICT (book_id, chapter_number) DO UPDATE SET
              title = EXCLUDED.title,
              content = EXCLUDED.content
          `
        )
      );
    }

    totalBooks++;
    totalChapters += chapters.length;
    console.log(`[ETL]   ✓ Done\n`);
  }

  console.log(`[ETL] ✅ Apocrypha seeding complete!`);
  console.log(`  Books: ${totalBooks}`);
  console.log(`  Chapters: ${totalChapters}`);
}

seed().catch(console.error);
