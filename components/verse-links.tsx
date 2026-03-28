"use client";

import React from "react";
import Link from "next/link";
import { BIBLE_BOOKS } from "@/lib/bible-books";

/**
 * Map of Bible book abbreviations / names to their canonical slugs.
 * Covers full names, common abbreviations, and single-word short forms.
 */
const BOOK_ALIAS_MAP: Record<string, string> = {};

// Build from BIBLE_BOOKS data
BIBLE_BOOKS.forEach((b) => {
  const lower = b.name.toLowerCase();
  BOOK_ALIAS_MAP[lower] = b.slug;
  // First word alias (e.g., "genesis" from "Genesis")
  const firstWord = lower.split(" ")[0];
  if (firstWord.length > 2) BOOK_ALIAS_MAP[firstWord] = b.slug;
});

// Additional common abbreviations
const EXTRA_ALIASES: Record<string, string> = {
  gen: "genesis", ge: "genesis", gn: "genesis",
  exo: "exodus", exod: "exodus", ex: "exodus",
  lev: "leviticus", le: "leviticus",
  num: "numbers", nu: "numbers", nm: "numbers",
  deu: "deuteronomy", deut: "deuteronomy", dt: "deuteronomy",
  josh: "joshua", jos: "joshua",
  judg: "judges", jdg: "judges",
  rth: "ruth", ru: "ruth",
  "1sa": "1-samuel", "1sam": "1-samuel", "1 sam": "1-samuel",
  "2sa": "2-samuel", "2sam": "2-samuel", "2 sam": "2-samuel",
  "1ki": "1-kings", "1kgs": "1-kings", "1 kgs": "1-kings",
  "2ki": "2-kings", "2kgs": "2-kings", "2 kgs": "2-kings",
  "1ch": "1-chronicles", "1chr": "1-chronicles", "1 chr": "1-chronicles",
  "2ch": "2-chronicles", "2chr": "2-chronicles", "2 chr": "2-chronicles",
  ezr: "ezra",
  neh: "nehemiah", ne: "nehemiah",
  est: "esther", esth: "esther",
  psa: "psalms", ps: "psalms", psalm: "psalms",
  pro: "proverbs", prov: "proverbs", pr: "proverbs",
  ecc: "ecclesiastes", eccl: "ecclesiastes", eccles: "ecclesiastes",
  "song": "song-of-solomon", "sol": "song-of-solomon", "sos": "song-of-solomon",
  isa: "isaiah", is: "isaiah",
  jer: "jeremiah", je: "jeremiah",
  lam: "lamentations", la: "lamentations",
  eze: "ezekiel", ezek: "ezekiel",
  dan: "daniel", da: "daniel",
  hos: "hosea", ho: "hosea",
  joe: "joel", jl: "joel",
  amo: "amos", am: "amos",
  oba: "obadiah", ob: "obadiah",
  jon: "jonah", jnh: "jonah",
  mic: "micah", mi: "micah",
  nah: "nahum", na: "nahum",
  hab: "habakkuk",
  zep: "zephaniah", zph: "zephaniah",
  hag: "haggai", hg: "haggai",
  zec: "zechariah", zech: "zechariah",
  mal: "malachi",
  mat: "matthew", matt: "matthew", mt: "matthew",
  mrk: "mark", mk: "mark",
  luk: "luke", lk: "luke",
  joh: "john", jn: "john",
  act: "acts", ac: "acts",
  rom: "romans", ro: "romans",
  "1co": "1-corinthians", "1cor": "1-corinthians", "1 cor": "1-corinthians",
  "2co": "2-corinthians", "2cor": "2-corinthians", "2 cor": "2-corinthians",
  gal: "galatians", ga: "galatians",
  eph: "ephesians",
  phi: "philippians", phil: "philippians", php: "philippians",
  col: "colossians",
  "1th": "1-thessalonians", "1thess": "1-thessalonians", "1 thess": "1-thessalonians",
  "2th": "2-thessalonians", "2thess": "2-thessalonians", "2 thess": "2-thessalonians",
  "1ti": "1-timothy", "1tim": "1-timothy", "1 tim": "1-timothy",
  "2ti": "2-timothy", "2tim": "2-timothy", "2 tim": "2-timothy",
  tit: "titus",
  phm: "philemon", phlm: "philemon",
  heb: "hebrews",
  jas: "james", jm: "james",
  "1pe": "1-peter", "1pet": "1-peter", "1 pet": "1-peter",
  "2pe": "2-peter", "2pet": "2-peter", "2 pet": "2-peter",
  "1jn": "1-john", "1jo": "1-john", "1 john": "1-john",
  "2jn": "2-john", "2jo": "2-john", "2 john": "2-john",
  "3jn": "3-john", "3jo": "3-john", "3 john": "3-john",
  jud: "jude",
  rev: "revelation", re: "revelation",
};

Object.entries(EXTRA_ALIASES).forEach(([alias, slug]) => {
  BOOK_ALIAS_MAP[alias.toLowerCase()] = slug;
});

/**
 * Resolves a book name/abbreviation to a slug.
 */
function resolveBookSlug(bookName: string): string | null {
  const normalized = bookName.toLowerCase().replace(/\.$/, "").trim();
  return BOOK_ALIAS_MAP[normalized] || null;
}

/**
 * Regex patterns for auto-detecting references in text.
 * Matches: "Gen. 1:1", "1 Corinthians 13:4-7", "Ps. 73:25", "Genesis 1:1-5", etc.
 */
const VERSE_REF_REGEX =
  /(?:(?:[1-3]\s)?[A-Z][a-z]+\.?\s*(?:of\s+(?:Solomon|Songs?))?\s*)\d{1,3}:\d{1,3}(?:\s*[-–—]\s*\d{1,3})?/g;

/**
 * Matches Strong's numbers: H430, G2316, H1, G1234
 */
const STRONGS_REGEX = /\b([HG]\d{1,5})\b/g;

interface VerseLinksProps {
  /** The raw text content to scan for references */
  text: string;
  /** Optional CSS class for the wrapper */
  className?: string;
}

/**
 * VerseLinks — a shared component that auto-detects Bible references
 * and Strong's numbers in text and renders them as clickable links.
 *
 * Usage: <VerseLinks text="See Genesis 1:1 and compare H430" />
 */
export function VerseLinks({ text, className }: VerseLinksProps) {
  if (!text) return null;

  // Find all verse references and Strong's numbers with their positions
  const segments: { start: number; end: number; type: "verse" | "strongs"; raw: string }[] = [];

  // Find verse references
  let match: RegExpExecArray | null;
  const verseRegex = new RegExp(VERSE_REF_REGEX.source, "g");
  while ((match = verseRegex.exec(text)) !== null) {
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "verse",
      raw: match[0],
    });
  }

  // Find Strong's numbers
  const strongsRegex = new RegExp(STRONGS_REGEX.source, "g");
  while ((match = strongsRegex.exec(text)) !== null) {
    // Avoid overlapping with verse references
    const overlaps = segments.some(
      (s) => match!.index >= s.start && match!.index < s.end
    );
    if (!overlaps) {
      segments.push({
        start: match.index,
        end: match.index + match[0].length,
        type: "strongs",
        raw: match[0],
      });
    }
  }

  // Sort by position
  segments.sort((a, b) => a.start - b.start);

  if (segments.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Build React elements
  const elements: React.ReactNode[] = [];
  let lastEnd = 0;

  segments.forEach((seg, i) => {
    // Add text before this match
    if (seg.start > lastEnd) {
      elements.push(<span key={`t-${i}`}>{text.slice(lastEnd, seg.start)}</span>);
    }

    if (seg.type === "verse") {
      const link = buildVerseLink(seg.raw);
      if (link) {
        elements.push(
          <Link
            key={`v-${i}`}
            href={link}
            className="text-gold hover:text-gold/80 underline decoration-gold/30 hover:decoration-gold/60 transition-colors"
            title={`Open ${seg.raw.trim()}`}
          >
            {seg.raw}
          </Link>
        );
      } else {
        elements.push(<span key={`v-${i}`}>{seg.raw}</span>);
      }
    } else if (seg.type === "strongs") {
      elements.push(
        <Link
          key={`s-${i}`}
          href={`/strongs?q=${seg.raw}`}
          className="font-mono text-xs px-1.5 py-0.5 rounded bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
          title={`Look up ${seg.raw} in Strong's Concordance`}
        >
          {seg.raw}
        </Link>
      );
    }

    lastEnd = seg.end;
  });

  // Add remaining text
  if (lastEnd < text.length) {
    elements.push(<span key="tail">{text.slice(lastEnd)}</span>);
  }

  return <span className={className}>{elements}</span>;
}

/**
 * Build a link path from a verse reference string.
 * "Genesis 1:1" → "/bible/genesis/1"
 * "1 Cor. 13:4" → "/bible/1-corinthians/13"
 */
function buildVerseLink(raw: string): string | null {
  const trimmed = raw.trim();
  // Split into book name and chapter:verse
  const chapterMatch = trimmed.match(/(\d{1,3}):\d{1,3}/);
  if (!chapterMatch) return null;

  const chapter = chapterMatch[1];
  const bookPart = trimmed.slice(0, chapterMatch.index).trim();
  const slug = resolveBookSlug(bookPart);

  if (!slug) return null;
  return `/bible/${slug}/${chapter}`;
}

export default VerseLinks;
