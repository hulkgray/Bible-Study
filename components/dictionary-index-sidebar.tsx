"use client";

import { BookText } from "lucide-react";
import { IndexSidebar } from "@/components/index-sidebar";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const SOURCES = [
  { key: "easton" as const, label: "Easton's" },
  { key: "webster1828" as const, label: "Webster 1828" },
];

interface DictionaryIndexSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeLetter: string | null;
  onLetterClick: (letter: string) => void;
  activeSource: "easton" | "webster1828";
  onSourceChange: (source: "easton" | "webster1828") => void;
}

/**
 * DictionaryIndexSidebar — A–Z letter index + Easton/Webster source toggle.
 * Uses the shared IndexSidebar shell for consistent slide-in UX across
 * Bible, Library, and Dictionary pages.
 */
export function DictionaryIndexSidebar({
  isOpen,
  onClose,
  activeLetter,
  onLetterClick,
  activeSource,
  onSourceChange,
}: DictionaryIndexSidebarProps) {
  return (
    <IndexSidebar
      isOpen={isOpen}
      onClose={onClose}
      title="Dictionary Index"
      icon={<BookText className="h-4 w-4 text-gold" />}
      headerContent={
        <div className="flex gap-1 px-4 py-2">
          {SOURCES.map((src) => (
            <button
              key={src.key}
              onClick={() => onSourceChange(src.key)}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                activeSource === src.key
                  ? "bg-gold/15 text-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {src.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-4 gap-2 p-4">
        {ALPHABET.map((letter) => (
          <button
            key={letter}
            onClick={() => {
              onLetterClick(letter);
              onClose();
            }}
            className={cn(
              "h-11 rounded-lg text-sm font-medium transition-all duration-150",
              activeLetter === letter
                ? "bg-gold text-gold-foreground shadow-border-small scale-105"
                : "bg-card border border-border hover:bg-muted hover:border-gold/30 text-foreground/70 hover:text-foreground"
            )}
          >
            {letter}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-border">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {activeSource === "easton"
            ? "Easton's Bible Dictionary — definitions of biblical terms, people, places, and theology."
            : "Webster's 1828 Dictionary — Noah Webster's original American English dictionary, contemporary with the KJV era."}
        </p>
      </div>
    </IndexSidebar>
  );
}
