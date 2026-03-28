"use client";

import React, { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((res) => res.data ?? res);

interface CitationTooltipProps {
  /** The book slug, e.g. "genesis" */
  bookSlug: string;
  /** Chapter number */
  chapter: number;
  /** Verse number (for display — we fetch the full chapter) */
  verse: number;
  /** End verse for ranges like "4-7" */
  endVerse?: number;
  /** Display text */
  children: React.ReactNode;
  /** Additional CSS */
  className?: string;
  /** Link href */
  href: string;
}

/**
 * CitationTooltip — wraps a verse reference link with a hover popover
 * that fetches and shows the actual verse text.
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
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<"above" | "below">("below");
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Only fetch when tooltip is open
  const { data: chapterData } = useSWR(
    isOpen ? `/api/bible/${bookSlug}/${chapter}` : null,
    fetcher,
    { dedupingInterval: 30000, revalidateOnFocus: false }
  );

  // Find the specific verse(s) from the chapter data
  const verseTexts: { verse: number; text: string }[] = [];
  if (chapterData?.verses) {
    const start = verse;
    const end = endVerse || verse;
    for (let v = start; v <= end; v++) {
      const found = chapterData.verses.find(
        (vr: { verse: number; text: string }) => vr.verse === v
      );
      if (found) {
        verseTexts.push({ verse: found.verse, text: found.text });
      }
    }
  }

  function handleOpen() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
    
    // Calculate position
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceBelow < 200 ? "above" : "below");
    }
  }

  function handleClose() {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  }

  function handleTooltipEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  function handleTooltipLeave() {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span className="relative inline">
      <a
        ref={triggerRef}
        href={href}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        className={cn(
          "text-gold hover:text-gold/80 underline decoration-gold/30 hover:decoration-gold/60 transition-colors cursor-pointer",
          className
        )}
      >
        {children}
      </a>

      {isOpen && (
        <div
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleTooltipLeave}
          className={cn(
            "absolute z-50 w-80 max-w-[90vw] p-3 rounded-xl bg-card border border-border shadow-2xl animate-scale-in",
            position === "below" ? "top-full mt-1 left-0" : "bottom-full mb-1 left-0"
          )}
        >
          <div className="text-xs font-medium text-gold mb-2">
            📖 {children}
          </div>
          {verseTexts.length > 0 ? (
            <div className="space-y-1 max-h-40 overflow-y-auto hide-scrollbar">
              {verseTexts.map((v) => (
                <p key={v.verse} className="text-xs text-foreground/80 leading-relaxed">
                  <span className="text-gold/60 font-mono text-[10px] mr-1">{v.verse}</span>
                  {v.text}
                </p>
              ))}
            </div>
          ) : chapterData ? (
            <p className="text-xs text-muted-foreground italic">Verse not found.</p>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-3 w-3 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              Loading verse...
            </div>
          )}
        </div>
      )}
    </span>
  );
}
