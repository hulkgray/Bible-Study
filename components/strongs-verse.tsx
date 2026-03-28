"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface StrongsPopoverData {
  strongsNumber: string;
  originalWord: string;
  transliteration: string;
  pronunciation: string;
  definition: string;
  language: string;
}

/**
 * Renders a tagged verse with inline Strong's numbers as interactive elements.
 * Input format: "In the beginning[H7225] God[H430] created[H1254]..."
 * 
 * Each [H####] or [G####] becomes a clickable superscript that shows
 * a popover with the Strong's definition on click.
 */
export function StrongsVerse({ taggedText }: { taggedText: string }) {
  const [activeNumber, setActiveNumber] = useState<string | null>(null);
  const [popoverData, setPopoverData] = useState<StrongsPopoverData | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveNumber(null);
        setPopoverData(null);
        setPopoverPos(null);
      }
    }
    if (activeNumber) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [activeNumber]);

  async function handleStrongsClick(num: string, el: HTMLElement) {
    // If clicking the same one, toggle off
    if (activeNumber === num) {
      setActiveNumber(null);
      setPopoverData(null);
      setPopoverPos(null);
      return;
    }

    setActiveNumber(num);
    setLoading(true);

    // Position the popover using viewport coordinates (fixed positioning)
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    
    if (spaceBelow > 250) {
      // Show below
      setPopoverPos({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 6,
      });
    } else {
      // Show above
      setPopoverPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 6,
      });
    }

    try {
      const res = await fetch(`/api/strongs/${num}`);
      if (res.ok) {
        const json = await res.json();
        setPopoverData(json.data);
      } else {
        setPopoverData(null);
      }
    } catch {
      setPopoverData(null);
    } finally {
      setLoading(false);
    }
  }

  // Parse the tagged text into segments
  // Pattern: text followed by one or more [H####] or [G####]
  const segments = parseTaggedText(taggedText);

  return (
    <span ref={containerRef} className="relative inline">
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          // Handle <em> tags for italicized words
          if (seg.content.includes("<em>")) {
            const parts = seg.content.split(/(<em>.*?<\/em>)/);
            return (
              <Fragment key={i}>
                {parts.map((part, j) => {
                  const emMatch = part.match(/^<em>(.*?)<\/em>$/);
                  if (emMatch) {
                    return <i key={j}>{emMatch[1]}</i>;
                  }
                  return <Fragment key={j}>{part}</Fragment>;
                })}
              </Fragment>
            );
          }
          return <Fragment key={i}>{seg.content}</Fragment>;
        }

        // Strong's number marker
        return (
          <button
            key={i}
            className="strongs-marker"
            title={`Strong's ${seg.content}`}
            onClick={(e) => handleStrongsClick(seg.content, e.currentTarget)}
            aria-label={`Strong's number ${seg.content}`}
          >
            {seg.content}
          </button>
        );
      })}

      {/* Popover — rendered via portal to escape overflow clipping */}
      {activeNumber && popoverPos && typeof document !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-100 w-72 p-3 rounded-xl bg-[#1c1917] border border-gold/20 shadow-2xl shadow-black/60 text-sm animate-scale-in"
          style={{
            left: `${Math.min(Math.max(popoverPos.x, 150), window.innerWidth - 160)}px`,
            top: `${popoverPos.y}px`,
            transform: popoverPos.y > window.innerHeight / 2
              ? "translateX(-50%) translateY(-100%)"
              : "translateX(-50%)",
          }}
        >
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-3 w-3 rounded-full border-2 border-gold/40 border-t-gold animate-spin" />
              Loading...
            </div>
          ) : popoverData ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gold font-mono font-bold text-xs">
                  {popoverData.strongsNumber}
                </span>
                <span className="text-[10px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {popoverData.language}
                </span>
              </div>

              {popoverData.originalWord && (
                <div className="text-lg font-scripture text-foreground/90 text-center py-1">
                  {popoverData.originalWord}
                </div>
              )}

              {popoverData.transliteration && (
                <div className="text-xs text-muted-foreground italic text-center">
                  {popoverData.transliteration}
                  {popoverData.pronunciation && (
                    <span className="text-foreground/50 ml-1">
                      ({popoverData.pronunciation})
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs text-foreground/70 leading-relaxed border-t border-border pt-2">
                {popoverData.definition.length > 250
                  ? popoverData.definition.slice(0, 250) + "…"
                  : popoverData.definition}
              </p>

              <Link
                href={`/strongs?search=${popoverData.strongsNumber}`}
                className="block text-[10px] text-gold hover:text-gold/80 text-center mt-1 underline decoration-gold/30"
                onClick={() => {
                  setActiveNumber(null);
                  setPopoverData(null);
                }}
              >
                View full entry →
              </Link>
            </div>
          ) : (
            <div className="text-muted-foreground text-xs">
              No definition found for {activeNumber}
            </div>
          )}
        </div>,
        document.body
      )}
    </span>
  );
}

interface Segment {
  type: "text" | "strongs";
  content: string;
}

/**
 * Parse tagged text into alternating text and Strong's number segments.
 * "God[H430] created[H1254]" → 
 *   [{type:"text", content:"God"}, {type:"strongs", content:"H430"}, 
 *    {type:"text", content:" created"}, {type:"strongs", content:"H1254"}]
 */
function parseTaggedText(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match [H####] or [G####] — one or more digits
  const regex = /\[([HG]\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "strongs", content: match[1] });
    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}
