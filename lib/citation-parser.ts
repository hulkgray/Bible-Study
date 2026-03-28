import { BIBLE_BOOKS } from "@/lib/bible-books";

/**
 * Book name alias map for resolving citations to slugs.
 */
const BOOK_ALIAS_MAP: Record<string, string> = {};
BIBLE_BOOKS.forEach((b) => {
  BOOK_ALIAS_MAP[b.name.toLowerCase()] = b.slug;
});

// Common short aliases
const ALIASES: Record<string, string> = {
  gen: "genesis", genesis: "genesis",
  exod: "exodus", exodus: "exodus", ex: "exodus",
  lev: "leviticus", leviticus: "leviticus",
  num: "numbers", numbers: "numbers",
  deut: "deuteronomy", deuteronomy: "deuteronomy",
  josh: "joshua", joshua: "joshua",
  judg: "judges", judges: "judges",
  ruth: "ruth",
  "1 samuel": "1-samuel", "1 sam": "1-samuel",
  "2 samuel": "2-samuel", "2 sam": "2-samuel",
  "1 kings": "1-kings", "1 kgs": "1-kings",
  "2 kings": "2-kings", "2 kgs": "2-kings",
  "1 chronicles": "1-chronicles", "1 chr": "1-chronicles",
  "2 chronicles": "2-chronicles", "2 chr": "2-chronicles",
  ezra: "ezra", nehemiah: "nehemiah",
  esther: "esther", job: "job",
  psalms: "psalms", psalm: "psalms", ps: "psalms",
  proverbs: "proverbs", prov: "proverbs",
  ecclesiastes: "ecclesiastes", eccl: "ecclesiastes",
  "song of solomon": "song-of-solomon", "song of songs": "song-of-solomon",
  isaiah: "isaiah", isa: "isaiah",
  jeremiah: "jeremiah", jer: "jeremiah",
  lamentations: "lamentations", lam: "lamentations",
  ezekiel: "ezekiel", ezek: "ezekiel",
  daniel: "daniel", dan: "daniel",
  hosea: "hosea", joel: "joel", amos: "amos",
  obadiah: "obadiah", jonah: "jonah", micah: "micah",
  nahum: "nahum", habakkuk: "habakkuk",
  zephaniah: "zephaniah", haggai: "haggai",
  zechariah: "zechariah", zech: "zechariah",
  malachi: "malachi", mal: "malachi",
  matthew: "matthew", matt: "matthew", mt: "matthew",
  mark: "mark", mk: "mark",
  luke: "luke", lk: "luke",
  john: "john", jn: "john",
  acts: "acts",
  romans: "romans", rom: "romans",
  "1 corinthians": "1-corinthians", "1 cor": "1-corinthians",
  "2 corinthians": "2-corinthians", "2 cor": "2-corinthians",
  galatians: "galatians", gal: "galatians",
  ephesians: "ephesians", eph: "ephesians",
  philippians: "philippians", phil: "philippians",
  colossians: "colossians", col: "colossians",
  "1 thessalonians": "1-thessalonians", "1 thess": "1-thessalonians",
  "2 thessalonians": "2-thessalonians", "2 thess": "2-thessalonians",
  "1 timothy": "1-timothy", "1 tim": "1-timothy",
  "2 timothy": "2-timothy", "2 tim": "2-timothy",
  titus: "titus", philemon: "philemon",
  hebrews: "hebrews", heb: "hebrews",
  james: "james", jas: "james",
  "1 peter": "1-peter", "1 pet": "1-peter",
  "2 peter": "2-peter", "2 pet": "2-peter",
  "1 john": "1-john",
  "2 john": "2-john",
  "3 john": "3-john",
  jude: "jude",
  revelation: "revelation", rev: "revelation",
};

Object.entries(ALIASES).forEach(([k, v]) => {
  BOOK_ALIAS_MAP[k.toLowerCase()] = v;
});

export interface ParsedCitation {
  type: "verse" | "strongs" | "dictionary";
  raw: string;          // Original matched text including brackets
  display: string;      // Display text
  href: string;         // Link destination
  start: number;        // Position in original text  
  end: number;
}

/**
 * Parses AI response text for structured citations.
 * 
 * Supported patterns:
 *   [Genesis 1:1]         → Bible verse link
 *   [John 3:16-17]        → Bible verse link
 *   [1 Corinthians 13:4]  → Bible verse link
 *   [H430]                → Strong's Hebrew
 *   [G2316]               → Strong's Greek
 *   [dict:Covenant]       → Dictionary entry
 */
export function parseCitations(text: string): ParsedCitation[] {
  const citations: ParsedCitation[] = [];

  // Pattern for bracketed citations
  const citationRegex = /\[([^\]]+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(text)) !== null) {
    const content = match[1].trim();
    const start = match.index;
    const end = start + match[0].length;

    // Check for Strong's number: H430, G2316
    const strongsMatch = content.match(/^([HG]\d{1,5})$/);
    if (strongsMatch) {
      citations.push({
        type: "strongs",
        raw: match[0],
        display: strongsMatch[1],
        href: `/strongs?q=${strongsMatch[1]}`,
        start,
        end,
      });
      continue;
    }

    // Check for dictionary: dict:Covenant
    const dictMatch = content.match(/^dict:(.+)$/i);
    if (dictMatch) {
      citations.push({
        type: "dictionary",
        raw: match[0],
        display: dictMatch[1],
        href: `/dictionary?q=${encodeURIComponent(dictMatch[1])}`,
        start,
        end,
      });
      continue;
    }

    // Check for Bible verse: Genesis 1:1, 1 Corinthians 13:4-7
    const verseMatch = content.match(/^((?:[1-3]\s)?[A-Za-z][a-z]+(?:\s+[Oo]f\s+[A-Za-z]+)?)\s+(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?$/);
    if (verseMatch) {
      const bookName = verseMatch[1].toLowerCase();
      const chapter = verseMatch[2];
      const slug = BOOK_ALIAS_MAP[bookName];
      if (slug) {
        citations.push({
          type: "verse",
          raw: match[0],
          display: content,
          href: `/bible/${slug}/${chapter}`,
          start,
          end,
        });
        continue;
      }
    }

    // If nothing matched, not a citation — skip
  }

  return citations;
}

/**
 * Extracts all unique citations from AI text and returns them
 * as a deduped list for the "Sources Referenced" footer.
 */
export function extractSourceFooter(
  citations: ParsedCitation[]
): { type: string; display: string; href: string }[] {
  const seen = new Set<string>();
  const sources: { type: string; display: string; href: string }[] = [];

  for (const c of citations) {
    const key = `${c.type}:${c.display}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const icon = c.type === "verse" ? "📖" : c.type === "strongs" ? "🔤" : "📚";
    sources.push({
      type: icon,
      display: c.display,
      href: c.href,
    });
  }

  return sources;
}
