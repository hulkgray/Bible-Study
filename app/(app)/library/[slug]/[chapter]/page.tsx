"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, List } from "lucide-react";
import { LibraryIndexSidebar } from "@/components/library-index-sidebar";
import { Streamdown } from "streamdown";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((res) => res.data ?? res);

export default function ChapterReadPage() {
  const { slug, chapter } = useParams<{ slug: string; chapter: string }>();
  const [showIndex, setShowIndex] = useState(false);

  const { data, isLoading } = useSWR(
    slug && chapter ? `/api/library/${slug}/${chapter}` : null,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  // Fetch book for chapter list (sidebar + prev/next nav)
  const { data: book } = useSWR(
    slug ? `/api/library/${slug}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const chapterNum = parseInt(chapter, 10);
  const chapters = book?.chapters ?? [];
  const totalChapters = chapters.length;
  const hasPrev = chapterNum > 1;
  const hasNext = chapterNum < totalChapters;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
        <div className="h-4 bg-muted rounded w-24 mb-6" />
        <div className="h-6 bg-muted rounded w-2/3 mb-2" />
        <div className="h-4 bg-muted rounded w-1/3 mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <h1 className="text-xl font-semibold mb-2">Chapter not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This chapter doesn&apos;t exist.
        </p>
        <Link
          href={`/library/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Book
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Chapter index sidebar */}
      {chapters.length > 0 && (
        <LibraryIndexSidebar
          isOpen={showIndex}
          onClose={() => setShowIndex(false)}
          bookSlug={slug}
          bookTitle={data.bookTitle}
          chapters={chapters}
          activeChapter={chapterNum}
        />
      )}

      {/* Breadcrumb + index button */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/library" className="hover:text-gold transition-colors">
            Library
          </Link>
          <span>/</span>
          <Link href={`/library/${slug}`} className="hover:text-gold transition-colors">
            {data.bookTitle}
          </Link>
          <span>/</span>
          <span className="text-foreground/70">Ch. {data.chapterNumber}</span>
        </div>
        {chapters.length > 0 && (
          <button
            onClick={() => setShowIndex(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all"
          >
            <List className="h-3.5 w-3.5" />
            Index
          </button>
        )}
      </div>

      {/* Chapter header */}
      <div className="mb-8 animate-slide-up">
        <h1 className="text-xl sm:text-2xl font-scripture font-semibold mb-1">
          {data.title || `Chapter ${data.chapterNumber}`}
        </h1>
        <p className="text-xs text-muted-foreground">
          {data.bookTitle} by {data.bookAuthor}
        </p>
      </div>

      {/* Chapter content — rendered as markdown */}
      <div className="font-scripture text-base leading-relaxed text-foreground/85 animate-fade-in">
        <Streamdown isAnimating={false}>
          {data.content}
        </Streamdown>
      </div>

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between mt-12 pt-6 border-t border-border/50">
        {hasPrev ? (
          <Link
            href={`/library/${slug}/${chapterNum - 1}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous Chapter
          </Link>
        ) : (
          <div />
        )}
        {hasNext ? (
          <Link
            href={`/library/${slug}/${chapterNum + 1}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            Next Chapter
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href={`/library/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            Back to Book
          </Link>
        )}
      </div>
    </div>
  );
}
