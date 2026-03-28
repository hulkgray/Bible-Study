"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { IndexSidebar } from "@/components/index-sidebar";
import { cn } from "@/lib/utils";

interface LibraryIndexSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Book slug for building links */
  bookSlug: string;
  /** Book title for the sidebar header */
  bookTitle: string;
  /** Chapters list */
  chapters: { chapterNumber: number; title: string | null }[];
  /** Currently active chapter number */
  activeChapter?: number;
}

/**
 * LibraryIndexSidebar — chapter index sidebar for library books.
 * Uses the shared IndexSidebar shell with a chapter grid.
 */
export function LibraryIndexSidebar({
  isOpen,
  onClose,
  bookSlug,
  bookTitle,
  chapters,
  activeChapter,
}: LibraryIndexSidebarProps) {
  return (
    <IndexSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={bookTitle}
      icon={<BookOpen className="h-4 w-4 text-gold" />}
    >
      <div className="p-3">
        <div className="px-1 py-1 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
            Chapters ({chapters.length})
          </span>
        </div>
        <div className="space-y-0.5">
          {chapters.map((ch) => {
            const isActive = activeChapter === ch.chapterNumber;
            return (
              <Link
                key={ch.chapterNumber}
                href={`/library/${bookSlug}/${ch.chapterNumber}`}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-gold/15 text-gold"
                    : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-md text-xs font-mono font-semibold shrink-0",
                  isActive
                    ? "bg-gold text-background"
                    : "bg-muted/30 text-muted-foreground"
                )}>
                  {ch.chapterNumber}
                </span>
                <span className="truncate text-xs">
                  {ch.title || `Chapter ${ch.chapterNumber}`}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </IndexSidebar>
  );
}
