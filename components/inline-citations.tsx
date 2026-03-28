"use client";

import React from "react";
import Link from "next/link";
import { parseCitations, type ParsedCitation } from "@/lib/citation-parser";
import { CitationTooltip } from "@/components/citation-tooltip";

interface InlineCitationsProps {
  /** Raw markdown text from the AI response */
  text: string;
}

/**
 * InlineCitations — takes raw AI text and renders bracketed citations
 * as interactive, hoverable links inline with the text.
 * 
 * [Genesis 1:1]  → gold link with verse preview tooltip
 * [H430]         → Strong's concordance link
 * [dict:Covenant] → Dictionary link
 * 
 * Non-citation text is returned as-is (no markdown rendering).
 * This is designed to be composed with Streamdown — it only processes
 * the post-rendered text that Streamdown outputs.
 */
export function InlineCitations({ text }: InlineCitationsProps) {
  const citations = parseCitations(text);

  if (citations.length === 0) {
    return <>{text}</>;
  }

  const elements: React.ReactNode[] = [];
  let lastEnd = 0;

  citations.forEach((citation, i) => {
    // Add text before this citation
    if (citation.start > lastEnd) {
      elements.push(
        <span key={`t-${i}`}>{text.slice(lastEnd, citation.start)}</span>
      );
    }

    // Render the citation based on type
    elements.push(renderCitation(citation, i));
    lastEnd = citation.end;
  });

  // Add remaining text
  if (lastEnd < text.length) {
    elements.push(<span key="tail">{text.slice(lastEnd)}</span>);
  }

  return <>{elements}</>;
}

function renderCitation(citation: ParsedCitation, key: number): React.ReactNode {
  switch (citation.type) {
    case "verse": {
      // Parse book slug from href: /bible/genesis/1
      const hrefParts = citation.href.split("/");
      const bookSlug = hrefParts[2] || "";
      const chapter = parseInt(hrefParts[3] || "1", 10);

      // Parse verse from display: "Genesis 1:1" → verse 1
      const verseMatch = citation.display.match(/(\d+):(\d+)(?:\s*[-–]\s*(\d+))?$/);
      const verse = verseMatch ? parseInt(verseMatch[2], 10) : 1;
      const endVerse = verseMatch?.[3] ? parseInt(verseMatch[3], 10) : undefined;

      return (
        <CitationTooltip
          key={`c-${key}`}
          bookSlug={bookSlug}
          chapter={chapter}
          verse={verse}
          endVerse={endVerse}
          href={citation.href}
        >
          {citation.display}
        </CitationTooltip>
      );
    }

    case "strongs":
      return (
        <Link
          key={`c-${key}`}
          href={citation.href}
          className="font-mono text-xs px-1.5 py-0.5 rounded bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
          title={`Look up ${citation.display} in Strong's Concordance`}
        >
          {citation.display}
        </Link>
      );

    case "dictionary":
      return (
        <Link
          key={`c-${key}`}
          href={citation.href}
          className="text-gold hover:text-gold/80 underline decoration-dotted decoration-gold/30 hover:decoration-gold/60 transition-colors"
          title={`Look up "${citation.display}" in the dictionary`}
        >
          {citation.display}
        </Link>
      );

    default:
      return <span key={`c-${key}`}>{citation.raw}</span>;
  }
}
