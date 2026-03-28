"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import { BIBLE_BOOKS } from "@/lib/bible-books";
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

export default function BibleIndexPage() {
  const [activeTestament, setActiveTestament] = useState<Testament>("OT");
  const [expandedBook, setExpandedBook] = useState<string | null>(null);

  const sections = activeTestament === "OT" ? OT_SECTIONS : NT_SECTIONS;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-scripture font-semibold tracking-tight">
          <BookOpen className="inline h-8 w-8 text-gold mr-2 -mt-1" />
          The Holy Bible
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          66 Books · Select a book and chapter to begin reading
        </p>
      </div>

      {/* Testament Toggle */}
      <div className="flex justify-center gap-2 mb-8">
        <button
          onClick={() => setActiveTestament("OT")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            activeTestament === "OT"
              ? "bg-gold/15 text-gold border border-gold/30 shadow-sm"
              : "text-muted-foreground hover:bg-muted border border-transparent"
          )}
        >
          Old Testament
          <span className="text-xs ml-1.5 text-muted-foreground">(39)</span>
        </button>
        <button
          onClick={() => setActiveTestament("NT")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            activeTestament === "NT"
              ? "bg-gold/15 text-gold border border-gold/30 shadow-sm"
              : "text-muted-foreground hover:bg-muted border border-transparent"
          )}
        >
          New Testament
          <span className="text-xs ml-1.5 text-muted-foreground">(27)</span>
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section) => {
          const books = BIBLE_BOOKS.filter(
            (b) => b.bookNumber >= section.range[0] && b.bookNumber <= section.range[1]
          );

          return (
            <div key={section.label}>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground/60 font-medium mb-3 px-1">
                {section.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {books.map((book) => {
                  const isExpanded = expandedBook === book.slug;

                  return (
                    <div key={book.slug} className="rounded-xl border border-border/50 overflow-hidden">
                      {/* Book header */}
                      <button
                        onClick={() => setExpandedBook(isExpanded ? null : book.slug)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 text-left transition-all",
                          isExpanded
                            ? "bg-gold/10 text-gold"
                            : "hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground/50 w-5 text-right">
                            {book.bookNumber}
                          </span>
                          <span className="font-medium text-sm">{book.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {book.chapters} ch.
                          </span>
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 text-muted-foreground transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </div>
                      </button>

                      {/* Chapter grid */}
                      {isExpanded && (
                        <div className="px-4 py-3 bg-muted/20 border-t border-border/30 animate-fade-in">
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from({ length: book.chapters }, (_, i) => i + 1).map(
                              (ch) => (
                                <Link
                                  key={ch}
                                  href={`/bible/${book.slug}/${ch}`}
                                  className="w-9 h-9 flex items-center justify-center rounded-lg text-xs font-medium text-foreground/70 hover:bg-gold/15 hover:text-gold border border-border/30 hover:border-gold/30 transition-all"
                                >
                                  {ch}
                                </Link>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
