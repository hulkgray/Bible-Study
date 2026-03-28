"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { ArrowLeft, BookOpen, User, List } from "lucide-react";
import { LibraryIndexSidebar } from "@/components/library-index-sidebar";
import { cn } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((res) => res.data ?? res);

export default function BookDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [showIndex, setShowIndex] = useState(false);

  const { data: book, isLoading, error } = useSWR(
    slug ? `/api/library/${slug}` : null,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
        <div className="h-6 bg-muted rounded w-32 mb-6" />
        <div className="h-8 bg-muted rounded w-2/3 mb-3" />
        <div className="h-4 bg-muted rounded w-1/3 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <h1 className="text-xl font-semibold mb-2">Book not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The book you&apos;re looking for doesn&apos;t exist in the library.
        </p>
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Link>
      </div>
    );
  }

  const chapters = book.chapters ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Chapter index sidebar */}
      {chapters.length > 0 && (
        <LibraryIndexSidebar
          isOpen={showIndex}
          onClose={() => setShowIndex(false)}
          bookSlug={slug}
          bookTitle={book.title}
          chapters={chapters}
        />
      )}

      {/* Back link */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Library
        </Link>
        {chapters.length > 0 && (
          <button
            onClick={() => setShowIndex(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all"
          >
            <List className="h-3.5 w-3.5" />
            Chapter Index
          </button>
        )}
      </div>

      {/* Book header */}
      <div className="mb-8 animate-slide-up">
        <span className="inline-block px-2.5 py-1 rounded-lg bg-gold/10 text-gold text-xs font-medium uppercase mb-3">
          {book.bookType}
        </span>
        <h1 className="text-2xl sm:text-3xl font-scripture font-semibold mb-2">
          {book.title}
        </h1>
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
          <User className="h-3.5 w-3.5" />
          <span>{book.author}</span>
        </div>
        {book.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {book.description}
          </p>
        )}
      </div>

      {/* Chapter list */}
      {chapters.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground/70 mb-3">
            Chapters ({chapters.length})
          </h2>
          {chapters.map(
            (ch: { chapterNumber: number; title: string | null }, i: number) => (
              <Link
                key={ch.chapterNumber}
                href={`/library/${slug}/${ch.chapterNumber}`}
                className={cn(
                  "group flex items-center justify-between p-4 rounded-xl bg-card border border-border",
                  "hover:border-gold/20 hover:shadow-md transition-all animate-slide-up"
                )}
                style={{ animationDelay: `${i * 25}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-gold/10 text-gold text-sm font-mono font-semibold">
                    {ch.chapterNumber}
                  </span>
                  <span className="text-sm font-medium group-hover:text-gold transition-colors">
                    {ch.title || `Chapter ${ch.chapterNumber}`}
                  </span>
                </div>
                <BookOpen className="h-4 w-4 text-muted-foreground/30 group-hover:text-gold transition-colors" />
              </Link>
            )
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p className="text-sm">No chapters available for this book.</p>
        </div>
      )}
    </div>
  );
}
