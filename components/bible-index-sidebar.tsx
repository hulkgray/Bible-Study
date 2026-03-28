"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import { IndexSidebar } from "@/components/index-sidebar";
import { cn } from "@/lib/utils";

type Testament = "OT" | "NT";

const OT_SECTIONS = [
  { label: "Pentateuch", range: [1, 5] },
  { label: "History", range: [6, 17] },
  { label: "Poetry & Wisdom", range: [18, 22] },
  { label: "Major Prophets", range: [23, 27] },
  { label: "Minor Prophets", range: [28, 39] },
];

const NT_SECTIONS = [
  { label: "Gospels", range: [40, 43] },
  { label: "History", range: [44, 44] },
  { label: "Pauline Epistles", range: [45, 57] },
  { label: "General Epistles", range: [58, 65] },
  { label: "Prophecy", range: [66, 66] },
];

interface BibleIndexSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Currently active book slug (for highlighting) */
  activeBookSlug?: string;
  /** Currently active chapter (for highlighting) */
  activeChapter?: number;
}

export function BibleIndexSidebar({
  isOpen,
  onClose,
  activeBookSlug,
  activeChapter,
}: BibleIndexSidebarProps) {
  const [activeTestament, setActiveTestament] = useState<Testament>("OT");
  const [expandedBook, setExpandedBook] = useState<string | null>(activeBookSlug || null);

  const sections = activeTestament === "OT" ? OT_SECTIONS : NT_SECTIONS;

  return (
    <IndexSidebar
      isOpen={isOpen}
      onClose={onClose}
      title="Bible Index"
      icon={<BookOpen className="h-4 w-4 text-gold" />}
      headerContent={
        <div className="flex gap-1 px-3 py-2">
          <button
            onClick={() => setActiveTestament("OT")}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTestament === "OT"
                ? "bg-gold/15 text-gold"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            Old Testament
          </button>
          <button
            onClick={() => setActiveTestament("NT")}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTestament === "NT"
                ? "bg-gold/15 text-gold"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            New Testament
          </button>
        </div>
      }
    >
      {sections.map((section) => {
        const books = BIBLE_BOOKS.filter(
          (b) => b.bookNumber >= section.range[0] && b.bookNumber <= section.range[1]
        );

        return (
          <div key={section.label} className="py-2">
            <div className="px-4 py-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
                {section.label}
              </span>
            </div>
            {books.map((book) => {
              const isExpanded = expandedBook === book.slug;
              const isActive = activeBookSlug === book.slug;

              return (
                <div key={book.slug}>
                  <button
                    onClick={() => setExpandedBook(isExpanded ? null : book.slug)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 text-left transition-all text-sm",
                      isActive
                        ? "text-gold bg-gold/5"
                        : "text-foreground/80 hover:bg-muted/50"
                    )}
                  >
                    <span className="font-medium">{book.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground/50">
                        {book.chapters}
                      </span>
                      <ChevronRight
                        className={cn(
                          "h-3 w-3 text-muted-foreground/40 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 py-2 bg-muted/10 animate-fade-in">
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: book.chapters }, (_, i) => i + 1).map(
                          (ch) => {
                            const isActiveChapter =
                              isActive && activeChapter === ch;
                            return (
                              <Link
                                key={ch}
                                href={`/bible/${book.slug}/${ch}`}
                                onClick={onClose}
                                className={cn(
                                  "w-8 h-8 flex items-center justify-center rounded-md text-xs font-medium transition-all",
                                  isActiveChapter
                                    ? "bg-gold text-background font-bold"
                                    : "text-foreground/60 hover:bg-gold/15 hover:text-gold border border-border/20 hover:border-gold/30"
                                )}
                              >
                                {ch}
                              </Link>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </IndexSidebar>
  );
}
