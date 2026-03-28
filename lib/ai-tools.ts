import { z } from "zod";
import { tool } from "ai";
import { getDbClient } from "@/lib/db";
import { BIBLE_BOOKS } from "@/lib/bible-books";

/**
 * AI SDK tools for Bible Study RAG.
 * These tools allow the AI to look up verses, Strong's entries,
 * and dictionary definitions from the database to ground its citations
 * in actual data rather than relying solely on training data.
 *
 * Uses `inputSchema` (AI SDK v5+) not deprecated `parameters`.
 */

/**
 * Resolve a book slug or name to the proper DB `book` value and number.
 * The DB stores book names as "Genesis", "1 Corinthians", etc.
 */
function resolveBook(input: string): { name: string; bookNumber: number } | null {
  const normalized = input.toLowerCase().replace(/-/g, " ").trim();
  const match = BIBLE_BOOKS.find(
    (b) =>
      b.slug === input.toLowerCase() ||
      b.name.toLowerCase() === normalized ||
      b.slug === normalized.replace(/\s+/g, "-")
  );
  return match ? { name: match.name, bookNumber: match.bookNumber } : null;
}

/**
 * Look up the exact text of Bible verse(s) from the database.
 * The AI calls this when it wants to cite a specific verse accurately.
 */
export const lookupVerse = tool({
  description:
    "Look up the exact text of Bible verse(s) from the database. Use this to verify verse citations and provide accurate Scripture quotes to the user.",
  inputSchema: z.object({
    book: z
      .string()
      .describe("Book name or slug, e.g. 'Genesis', 'genesis', 'john', '1 Corinthians', '1-corinthians'"),
    chapter: z.number().describe("Chapter number"),
    startVerse: z.number().describe("Starting verse number"),
    endVerse: z
      .number()
      .optional()
      .describe("Ending verse number for a range (inclusive). Omit for single verse."),
    translation: z
      .string()
      .default("kjv")
      .describe("Translation code, e.g. 'kjv', 'web', 'asv'. Defaults to KJV."),
  }),
  execute: async ({ book, chapter, startVerse, endVerse, translation }) => {
    try {
      const sql = getDbClient();
      const end = endVerse ?? startVerse;

      // Resolve slug/name to the actual DB book name and number
      const resolved = resolveBook(book);
      if (!resolved) {
        return {
          found: false,
          message: `Unknown book: "${book}". Use full name (e.g. "Genesis") or slug (e.g. "genesis").`,
        };
      }

      const rows = await sql`
        SELECT verse, text
        FROM bible_verses
        WHERE book_number = ${resolved.bookNumber}
          AND chapter = ${chapter}
          AND verse >= ${startVerse}
          AND verse <= ${end}
          AND translation_code = ${translation}
        ORDER BY verse
      `;

      if (rows.length === 0) {
        return {
          found: false,
          message: `No verses found for ${resolved.name} ${chapter}:${startVerse}${endVerse ? `-${endVerse}` : ""} (${translation.toUpperCase()})`,
        };
      }

      return {
        found: true,
        reference: `${resolved.name} ${chapter}:${startVerse}${endVerse ? `-${endVerse}` : ""}`,
        translation: translation.toUpperCase(),
        verses: rows.map((r) => ({
          verse: r.verse,
          text: r.text,
        })),
      };
    } catch (error) {
      console.error("[AI Tool: lookup_verse] Error:", error);
      return { found: false, message: "Database lookup failed" };
    }
  },
});

/**
 * Look up a Strong's concordance entry by number.
 * The AI calls this to get original language definitions.
 */
export const lookupStrongs = tool({
  description:
    "Look up a Strong's concordance entry by number. Use this to provide accurate Hebrew/Greek word definitions and etymology. Returns the original word, transliteration, pronunciation, and full definition.",
  inputSchema: z.object({
    number: z
      .string()
      .describe(
        "Strong's number with prefix, e.g. 'G26' for Greek or 'H430' for Hebrew"
      ),
  }),
  execute: async ({ number }) => {
    try {
      const sql = getDbClient();
      const normalized = number.toUpperCase();

      const rows = await sql`
        SELECT strongs_number, language, original_word, transliteration, pronunciation, definition
        FROM strongs_entries
        WHERE strongs_number = ${normalized}
      `;

      if (rows.length === 0) {
        return { found: false, message: `Strong's number ${normalized} not found` };
      }

      const entry = rows[0];
      return {
        found: true,
        strongsNumber: entry.strongs_number,
        language: entry.language,
        originalWord: entry.original_word,
        transliteration: entry.transliteration,
        pronunciation: entry.pronunciation,
        definition: entry.definition,
      };
    } catch (error) {
      console.error("[AI Tool: lookup_strongs] Error:", error);
      return { found: false, message: "Database lookup failed" };
    }
  },
});

/**
 * Look up a term in BOTH the Bible dictionary (Easton's) and
 * Webster's 1828 dictionary in parallel.
 * Returns results from both sources for comprehensive definitions.
 */
export const lookupDictionary = tool({
  description:
    "Look up a biblical or theological term in the dictionaries. Searches both Easton's Bible Dictionary and Webster's 1828 Dictionary simultaneously, returning results from both. Use this for defining biblical concepts, places, people, or theological terms.",
  inputSchema: z.object({
    term: z
      .string()
      .describe(
        "The term to look up, e.g. 'Covenant', 'Atonement', 'Tabernacle'"
      ),
  }),
  execute: async ({ term }) => {
    try {
      const sql = getDbClient();

      // Query BOTH dictionaries in parallel for comprehensive results
      const [eastonRows, websterRows] = await Promise.all([
        sql`
          SELECT headword, definition
          FROM dictionary_entries
          WHERE headword ILIKE ${term}
          LIMIT 3
        `,
        sql`
          SELECT word, content
          FROM webster_1828
          WHERE word ILIKE ${term}
          LIMIT 3
        `.catch(() => []), // Gracefully handle if webster_1828 table doesn't exist yet
      ]);

      const results: {
        easton: { headword: string; definition: string }[] | null;
        webster1828: { word: string; definition: string }[] | null;
      } = {
        easton: eastonRows.length > 0
          ? eastonRows.map((r) => ({ headword: r.headword, definition: r.definition }))
          : null,
        webster1828: websterRows.length > 0
          ? websterRows.map((r) => ({ word: r.word, definition: r.content }))
          : null,
      };

      if (!results.easton && !results.webster1828) {
        return { found: false, message: `No dictionary entries found for "${term}"` };
      }

      return { found: true, term, ...results };
    } catch (error) {
      console.error("[AI Tool: lookup_dictionary] Error:", error);
      return { found: false, message: "Dictionary lookup failed" };
    }
  },
});

/**
 * All tools bundled for use in streamText().
 */
export const bibleStudyTools = {
  lookup_verse: lookupVerse,
  lookup_strongs: lookupStrongs,
  lookup_dictionary: lookupDictionary,
};
