"use client";

import React, { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { X } from "lucide-react";

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
 * CitationTooltip — wraps a verse reference link with:
 * - Desktop: hover popover showing actual verse text
 * - Mobile: tap opens a centered modal with verse text + "Open in Bible" link
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
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Only fetch when tooltip/modal is open
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

  // Desktop hover handlers
  function handleMouseEnter() {
    if (isTouchDevice) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceBelow < 200 ? "above" : "below");
    }
  }

  function handleMouseLeave() {
    if (isTouchDevice) return;
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  }

  function handleTooltipEnter() {
    if (isTouchDevice) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  function handleTooltipLeave() {
    if (isTouchDevice) return;
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  }

  // Mobile tap handler
  function handleClick(e: React.MouseEvent) {
    if (isTouchDevice) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(true);
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Lock body scroll when modal is open on mobile
  useEffect(() => {
    if (isTouchDevice && isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isTouchDevice, isOpen]);

  // Verse content (shared between tooltip and modal)
  const verseContent = (
    <>
      {verseTexts.length > 0 ? (
        <div className="space-y-1.5 max-h-60 overflow-y-auto hide-scrollbar">
          {verseTexts.map((v) => (
            <p key={v.verse} className="text-sm text-foreground/80 leading-relaxed">
              <span className="text-gold/60 font-mono text-xs mr-1.5">{v.verse}</span>
              {v.text}
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
    <span className="relative inline">
      <a
        ref={triggerRef}
        href={href}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className={cn(
          "text-gold hover:text-gold/80 underline decoration-gold/30 hover:decoration-gold/60 transition-colors cursor-pointer",
          className
        )}
      >
        {children}
      </a>

      {/* Desktop: hover tooltip */}
      {isOpen && !isTouchDevice && (
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
          {verseContent}
        </div>
      )}

      {/* Mobile: centered modal with backdrop */}
      {isOpen && isTouchDevice && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal card */}
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl animate-scale-in p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gold flex items-center gap-1.5">
                📖 {children}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Verse content */}
            <div className="mb-4">
              {verseContent}
            </div>

            {/* Navigate to Bible button */}
            <Link
              href={href}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gold text-gold-foreground text-sm font-medium hover:bg-gold/90 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Read in Bible →
            </Link>
          </div>
        </div>
      )}
    </span>
  );
}
