"use client";

import useSWR from "swr";
import { Library as LibraryIcon, BookOpen, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((res) => res.data ?? res);

const TYPE_COLORS: Record<string, string> = {
  book: "bg-blue-500/15 text-blue-400",
  devotional: "bg-amber-500/15 text-amber-400",
  catechism: "bg-purple-500/15 text-purple-400",
  prayers: "bg-rose-500/15 text-rose-400",
};

export default function LibraryPage() {
  const { data, isLoading } = useSWR("/api/library", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const books = data ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-scripture font-semibold mb-2">
          Library
        </h1>
        <p className="text-muted-foreground text-sm">
          Classic Reformed & Puritan literature
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse p-5 rounded-xl bg-card h-36" />
          ))}
        </div>
      )}

      {books.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {books.map(
            (
              book: {
                id: string;
                slug: string;
                title: string;
                author: string;
                bookType: string;
                description: string | null;
              },
              i: number
            ) => (
              <Link
                key={book.id}
                href={`/library/${book.slug}`}
                className="group block p-5 rounded-xl bg-card border border-border hover:border-gold/20 hover:shadow-md transition-all animate-slide-up"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md text-xs font-medium uppercase",
                      TYPE_COLORS[book.bookType] ?? "bg-muted text-muted-foreground"
                    )}
                  >
                    {book.bookType}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-gold transition-colors" />
                </div>
                <h3 className="font-scripture text-lg font-semibold group-hover:text-gold transition-colors mb-1">
                  {book.title}
                </h3>
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <User className="h-3 w-3" />
                  <span>{book.author}</span>
                </div>
                {book.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {book.description}
                  </p>
                )}
              </Link>
            )
          )}
        </div>
      )}

      {!isLoading && books.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <LibraryIcon className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p>No books in the library yet.</p>
          <p className="text-sm mt-2">Run the ETL seed scripts to populate the database.</p>
        </div>
      )}

      {/* Sources & Thank You */}
      <div className="mt-16 pt-8 border-t border-border/50 animate-fade-in">
        <h2 className="text-lg font-scripture font-semibold mb-4 text-gold/80">
          Sources &amp; Thank You
        </h2>
        <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
          <p>
            All works in this library are in the <span className="text-foreground/70 font-medium">public domain</span> and
            are freely available for study and devotion. We are deeply grateful to the authors
            and translators whose labors continue to bless the Church centuries later.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-card border border-border">
              <h3 className="text-xs font-semibold text-foreground/70 mb-1.5">
                📚 Classic Literature
              </h3>
              <ul className="space-y-1">
                <li><span className="text-foreground/60">Charles H. Spurgeon</span> — All of Grace, Come Ye Children, Faith&apos;s Checkbook, Spurgeon&apos;s Prayers, Words of Warning for Daily Life</li>
                <li><span className="text-foreground/60">John Bunyan</span> — The Pilgrim&apos;s Progress</li>
                <li><span className="text-foreground/60">Charles H. Spurgeon</span> — A Puritan Catechism (from the Westminster Standards)</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-card border border-border">
              <h3 className="text-xs font-semibold text-foreground/70 mb-1.5">
                📖 Reference Works
              </h3>
              <ul className="space-y-1">
                <li><span className="text-foreground/60">James Strong</span> — Strong&apos;s Exhaustive Concordance (Greek &amp; Hebrew)</li>
                <li><span className="text-foreground/60">Matthew George Easton</span> — Easton&apos;s Bible Dictionary</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-card border border-border sm:col-span-2">
              <h3 className="text-xs font-semibold text-foreground/70 mb-1.5">
                ✝️ Bible Translations (10 versions)
              </h3>
              <p>
                King James Version (KJV) · American Standard Version (ASV) · Douay-Rheims Bible (DRB) ·
                Darby Bible Translation (DBT) · English Revised Version (ERV) · Webster Bible Translation (WBT) ·
                World English Bible (WEB) · Young&apos;s Literal Translation (YLT) · American King James Version (AKJV) ·
                Weymouth New Testament (WNT)
              </p>
            </div>
          </div>

          <p className="text-center text-muted-foreground/50 italic pt-4 font-scripture">
            &ldquo;Thy word is a lamp unto my feet, and a light unto my path.&rdquo;
            <br />
            <span className="text-gold/50 not-italic text-[10px]">— Psalm 119:105 (KJV)</span>
          </p>
        </div>
      </div>
    </div>
  );
}
