"use client";

import { useState } from "react";
import useSWR from "swr";
import { Library as LibraryIcon, BookOpen, ArrowRight, User, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((res) => res.data ?? res);

const TYPE_COLORS: Record<string, string> = {
  book: "bg-blue-500/15 text-blue-400",
  devotional: "bg-amber-500/15 text-amber-400",
  catechism: "bg-purple-500/15 text-purple-400",
  prayers: "bg-rose-500/15 text-rose-400",
  apocrypha: "bg-emerald-500/15 text-emerald-400",
};

const CATEGORY_COLORS: Record<string, string> = {
  theology: "bg-blue-500/15 text-blue-400",
  apocrypha: "bg-emerald-500/15 text-emerald-400",
  pseudepigrapha: "bg-teal-500/15 text-teal-400",
  "dead-sea-scrolls": "bg-orange-500/15 text-orange-400",
  "early-christian": "bg-violet-500/15 text-violet-400",
  "lost-books": "bg-cyan-500/15 text-cyan-400",
};

const CATEGORY_TABS = [
  { key: "all", label: "All" },
  { key: "theology", label: "Theology" },
  { key: "apocrypha", label: "Apocrypha" },
  { key: "pseudepigrapha", label: "Pseudepigrapha" },
  { key: "lost-books", label: "Lost Books" },
  { key: "dead-sea-scrolls", label: "Dead Sea Scrolls" },
  { key: "early-christian", label: "Early Church" },
];

export default function LibraryPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const { data, isLoading } = useSWR("/api/library", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const books = data ?? [];
  const filteredBooks = activeCategory === "all"
    ? books
    : books.filter((b: { category: string }) => b.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-scripture font-semibold mb-2">
          Library
        </h1>
        <p className="text-muted-foreground text-sm">
          Classic literature, deuterocanonical texts &amp; extra-biblical writings
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6 animate-slide-up">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveCategory(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
              activeCategory === tab.key
                ? "bg-gold/15 border-gold/30 text-gold"
                : "bg-muted border-transparent text-muted-foreground hover:border-border"
            )}
          >
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1 text-[10px] opacity-60">
                {books.filter((b: { category: string }) => b.category === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse p-5 rounded-xl bg-card h-36" />
          ))}
        </div>
      )}

      {filteredBooks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredBooks.map(
            (
              book: {
                id: string;
                slug: string;
                title: string;
                author: string;
                bookType: string;
                description: string | null;
                category: string;
              },
              i: number
            ) => (
              <Link
                key={book.id}
                href={`/library/${book.slug}`}
                className="group block p-5 rounded-xl bg-card border border-border hover:border-gold/20 hover:shadow-md transition-all animate-slide-up"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-medium uppercase",
                        TYPE_COLORS[book.bookType] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {book.bookType}
                    </span>
                    {book.category !== "theology" && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-medium",
                          CATEGORY_COLORS[book.category] ?? "bg-muted text-muted-foreground"
                        )}
                      >
                        {book.category.replace(/-/g, " ")}
                      </span>
                    )}
                  </div>
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

      {!isLoading && filteredBooks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <LibraryIcon className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p>No books found in this category.</p>
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

            <div className="p-3 rounded-lg bg-card border border-border">
              <h3 className="text-xs font-semibold text-foreground/70 mb-1.5">
                📜 Extra-Biblical Texts
              </h3>
              <p>
                Apocrypha, Pseudepigrapha, Dead Sea Scrolls, and Early Church writings sourced from the{" "}
                <a
                  href="https://github.com/scrollmapper/bible_databases_deuterocanonical"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold/70 hover:text-gold underline inline-flex items-center gap-0.5"
                >
                  Scrollmapper Project
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>{" "}
                (Public Domain).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-card border border-border">
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
