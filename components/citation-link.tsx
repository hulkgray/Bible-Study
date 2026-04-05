"use client";

import React from "react";
import { CitationTooltip } from "@/components/citation-tooltip";
import { StrongsTooltip } from "@/components/strongs-tooltip";
import { DictionaryTooltip } from "@/components/dictionary-tooltip";

/**
 * Shared link renderer for markdown — detects citation links
 * (added by remarkCitations plugin) and wraps them in the
 * appropriate tooltip component for verse hover previews,
 * Strong's Greek/Hebrew lookups, and dictionary definitions.
 *
 * Used by both Streamdown (AI Study chat) and MarkdownRenderer (Notes).
 */
export function CitationLink({
  href,
  title,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  // Check if this is a citation link (marked by our remark plugin)
  const isCitation = title && title.startsWith("citation:");
  const citationType = isCitation ? title.replace("citation:", "") : null;

  if (isCitation && citationType === "verse" && href) {
    // Parse: /bible/genesis/1
    const parts = href.split("/");
    const bookSlug = parts[2] || "";
    const chapter = parseInt(parts[3] || "1", 10);
    const displayText =
      typeof children === "string" ? children : String(children);
    const verseMatch = displayText.match(
      /(\d+):(\d+)(?:\s*[-–]\s*(\d+))?$/
    );
    const verse = verseMatch ? parseInt(verseMatch[2], 10) : 1;
    const endVerse = verseMatch?.[3]
      ? parseInt(verseMatch[3], 10)
      : undefined;

    return (
      <CitationTooltip
        bookSlug={bookSlug}
        chapter={chapter}
        verse={verse}
        endVerse={endVerse}
        href={href}
      >
        {children}
      </CitationTooltip>
    );
  }

  if (isCitation && citationType === "strongs" && href) {
    // Extract Strong's number from the href: /strongs?q=H430 → H430
    const qMatch = href.match(/[?&]q=([^&]+)/);
    const strongsNum = qMatch
      ? decodeURIComponent(qMatch[1])
      : String(children);

    return (
      <StrongsTooltip strongsNumber={strongsNum} href={href}>
        {children}
      </StrongsTooltip>
    );
  }

  if (isCitation && citationType === "dictionary" && href) {
    // Extract term from href: /dictionary?q=Covenant → Covenant
    const qMatch = href.match(/[?&]q=([^&]+)/);
    const term = qMatch ? decodeURIComponent(qMatch[1]) : String(children);

    return (
      <DictionaryTooltip term={term} href={href}>
        {children}
      </DictionaryTooltip>
    );
  }

  // Regular markdown link — render as standard anchor
  return (
    <a
      href={href}
      title={title}
      className="text-gold hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
}
