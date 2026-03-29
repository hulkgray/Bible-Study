"use client";

import React from "react";
import useSWR from "swr";
import DOMPurify from "dompurify";
import { SmartTooltip } from "@/components/ui/smart-tooltip";

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((res) => res.data ?? res);

interface CitationTooltipProps {
  bookSlug: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  children: React.ReactNode;
  className?: string;
  href: string;
}

/**
 * CitationTooltip — verse reference tooltip.
 * Fetches verse text on open, renders via SmartTooltip.
 */
export function CitationTooltip({
  bookSlug,
  chapter,
  verse,
  endVerse,
  children,
  className,
  href,
}: CitationTooltipProps) {
  return (
    <CitationTooltipInner
      bookSlug={bookSlug}
      chapter={chapter}
      verse={verse}
      endVerse={endVerse}
      href={href}
      className={className}
    >
      {children}
    </CitationTooltipInner>
  );
}

/**
 * Inner component so we can use hooks (SWR) conditionally
 * via SmartTooltip's lazy-load pattern. SmartTooltip controls open state,
 * but we need to always fetch when the tooltip renders since SmartTooltip
 * manages the mount/unmount cycle.
 */
function CitationTooltipInner({
  bookSlug,
  chapter,
  verse,
  endVerse,
  children,
  className,
  href,
}: CitationTooltipProps) {
  // We fetch eagerly here — SmartTooltip handles the open/close,
  // and SWR dedupes across components. We pass the content builder as a render function.
  const { data: chapterData } = useSWR(
    `/api/bible/${bookSlug}/${chapter}`,
    fetcher,
    { dedupingInterval: 30000, revalidateOnFocus: false }
  );

  // Extract verse(s)
  const verseTexts: { verse: number; text: string }[] = [];
  if (chapterData?.verses) {
    const start = verse;
    const end = endVerse || verse;
    for (let v = start; v <= end; v++) {
      const found = chapterData.verses.find(
        (vr: { verse: number; translations?: Record<string, string>; text?: string }) => vr.verse === v
      );
      if (found) {
        const text = found.translations
          ? (found.translations.kjv || Object.values(found.translations)[0] || "")
          : (found.text || "");
        if (text) verseTexts.push({ verse: found.verse, text });
      }
    }
  }

  const content = (
    <>
      {verseTexts.length > 0 ? (
        <div className="space-y-1.5 max-h-60 overflow-y-auto hide-scrollbar">
          {verseTexts.map((v) => (
            <p key={v.verse} className="text-sm text-foreground/80 leading-relaxed verse-text">
              <span className="text-gold/60 font-mono text-xs mr-1.5">{v.verse}</span>
              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(v.text, { ALLOWED_TAGS: ['i', 'em', 'b', 'strong'] }) }} />
            </p>
          ))}
        </div>
      ) : chapterData ? (
        <p className="text-sm text-muted-foreground italic">Verse not found.</p>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-3.5 w-3.5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          Loading verse...
        </div>
      )}
    </>
  );

  return (
    <SmartTooltip
      content={content}
      href={href}
      ctaLabel="Read in Bible →"
      headerIcon="📖"
      headerText={typeof children === "string" ? children : undefined}
      triggerClassName={`text-gold hover:text-gold/80 underline decoration-gold/30 hover:decoration-gold/60 transition-colors ${className || ""}`}
    >
      {children}
    </SmartTooltip>
  );
}
