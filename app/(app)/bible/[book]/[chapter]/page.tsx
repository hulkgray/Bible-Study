"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { BIBLE_BOOKS, TRANSLATIONS } from "@/lib/bible-books";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Bookmark, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((res) => res.data ?? res);

export default function BibleReaderPage() {
  const params = useParams<{ book: string; chapter: string }>();
  const router = useRouter();
  const bookSlug = params.book;
  const chapterNum = parseInt(params.chapter, 10);

  const [selectedTranslations, setSelectedTranslations] = useState(["kjv"]);
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);

  const bookInfo = BIBLE_BOOKS.find((b) => b.slug === bookSlug);

  const translationsParam = selectedTranslations.join(",");
  const { data, isLoading, error } = useSWR(
    bookInfo
      ? `/api/bible/${bookSlug}/${chapterNum}?translations=${translationsParam}`
      : null,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  const handleCopyVerse = async (verseNum: number, text: string) => {
    const ref = `${bookInfo?.name} ${chapterNum}:${verseNum}`;
    await navigator.clipboard.writeText(`${text}\n— ${ref} (${selectedTranslations[0].toUpperCase()})`);
    setCopiedVerse(verseNum);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  const navigateChapter = (delta: number) => {
    const newChapter = chapterNum + delta;
    if (bookInfo && newChapter >= 1 && newChapter <= bookInfo.chapters) {
      router.push(`/bible/${bookSlug}/${newChapter}`);
    }
  };

  if (!bookInfo) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Book not found: {bookSlug}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-scripture font-semibold">
            {bookInfo.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Chapter {chapterNum} of {bookInfo.chapters}
          </p>
        </div>

        {/* Chapter navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateChapter(-1)}
            disabled={chapterNum <= 1}
            className="p-2 rounded-lg bg-muted hover:bg-accent transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium min-w-[2rem] text-center">
            {chapterNum}
          </span>
          <button
            onClick={() => navigateChapter(1)}
            disabled={chapterNum >= bookInfo.chapters}
            className="p-2 rounded-lg bg-muted hover:bg-accent transition-colors disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Translation selector */}
      <div className="flex flex-wrap gap-2 mb-6 animate-slide-up">
        {TRANSLATIONS.map((t) => (
          <button
            key={t.code}
            onClick={() => {
              setSelectedTranslations((prev) =>
                prev.includes(t.code)
                  ? prev.length > 1
                    ? prev.filter((c) => c !== t.code)
                    : prev
                  : [...prev, t.code]
              );
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
              selectedTranslations.includes(t.code)
                ? "bg-gold/15 border-gold/30 text-gold"
                : "bg-muted border-transparent text-muted-foreground hover:border-border"
            )}
          >
            {t.abbreviation}
          </button>
        ))}
      </div>

      {/* Verses */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-6 text-center text-destructive">
          Failed to load chapter. Please try again.
        </div>
      )}

      {data?.verses && (
        <div className="space-y-1">
          {data.verses.map(
            (
              v: { verse: number; translations: Record<string, string> },
              i: number
            ) => (
              <div
                key={v.verse}
                className="group flex gap-3 py-2 px-3 -mx-3 rounded-lg hover:bg-accent/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 20}ms`, animationFillMode: "both" }}
              >
                {/* Verse number */}
                <span className="text-gold/70 font-mono text-xs font-semibold pt-1.5 min-w-[1.5rem] text-right shrink-0">
                  {v.verse}
                </span>

                {/* Verse text */}
                <div className="flex-1 space-y-2">
                  {selectedTranslations.map((tc) => (
                    <p
                      key={tc}
                      className={cn(
                        "font-scripture text-base leading-relaxed",
                        selectedTranslations.length > 1 &&
                          "border-l-2 border-gold/20 pl-3"
                      )}
                    >
                      {selectedTranslations.length > 1 && (
                        <span className="text-gold/50 text-xs font-sans font-medium mr-2 uppercase">
                          {tc}
                        </span>
                      )}
                      {v.translations[tc] || (
                        <span className="text-muted-foreground italic text-sm">
                          Not available
                        </span>
                      )}
                    </p>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-1">
                  <button
                    onClick={() =>
                      handleCopyVerse(
                        v.verse,
                        v.translations[selectedTranslations[0]] ?? ""
                      )
                    }
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title="Copy verse"
                  >
                    {copiedVerse === v.verse ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title="Bookmark verse"
                  >
                    <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Chapter nav footer */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
        <button
          onClick={() => navigateChapter(-1)}
          disabled={chapterNum <= 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-accent transition-colors disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Chapter
        </button>
        <button
          onClick={() => navigateChapter(1)}
          disabled={chapterNum >= bookInfo.chapters}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gold/15 text-gold hover:bg-gold/25 transition-colors disabled:opacity-30"
        >
          Next Chapter
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
