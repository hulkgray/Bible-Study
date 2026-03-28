"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Search as SearchIcon,
  BookOpen,
  BookText,
  Languages,
  Library,
  Filter,
  Layers,
} from "lucide-react";
import { TRANSLATIONS } from "@/lib/bible-books";
import { cn } from "@/lib/utils";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type SearchMode = "all" | "bible";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [translation, setTranslation] = useState("kjv");
  const [page, setPage] = useState(1);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("all");

  // Bible-only search URL
  const bibleSearchUrl =
    submittedQuery && mode === "bible"
      ? `/api/bible/search?q=${encodeURIComponent(submittedQuery)}&translation=${translation}&page=${page}&limit=20`
      : null;

  // Global search URL
  const globalSearchUrl =
    submittedQuery && mode === "all"
      ? `/api/search?q=${encodeURIComponent(submittedQuery)}&limit=10`
      : null;

  const { data: bibleData, isLoading: bibleLoading } = useSWR(
    bibleSearchUrl,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 2000 }
  );

  const { data: globalData, isLoading: globalLoading } = useSWR(
    globalSearchUrl,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 2000 }
  );

  const isLoading = bibleLoading || globalLoading;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setPage(1);
      setSubmittedQuery(query.trim());
    }
  };

  // Bible-only results
  const bibleResults = bibleData?.data ?? [];
  const bibleMeta = bibleData?.meta;

  // Global results
  const globalResults = globalData?.data;
  const globalMeta = globalData?.meta;

  const SOURCE_ICONS: Record<string, typeof BookOpen> = {
    bible: BookOpen,
    dictionary: BookText,
    strongs: Languages,
    library: Library,
  };

  const SOURCE_COLORS: Record<string, string> = {
    bible: "text-amber-500 bg-amber-500/10",
    dictionary: "text-purple-400 bg-purple-400/10",
    strongs: "text-emerald-400 bg-emerald-400/10",
    library: "text-blue-400 bg-blue-400/10",
  };

  const SOURCE_LABELS: Record<string, string> = {
    bible: "Bible",
    dictionary: "Dictionary",
    strongs: "Strong's",
    library: "Library",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-scripture font-semibold mb-2">
          Search Scripture
        </h1>
        <p className="text-muted-foreground text-sm">
          {mode === "all"
            ? "Search across Bible, dictionary, concordance, and library"
            : "Full-text search across all Bible translations"}
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-6 animate-slide-up">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === "all"
                  ? "Search everything — Bible, dictionary, Strong's, library..."
                  : "Search for a word, phrase, or topic..."
              }
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-gold text-gold-foreground text-sm font-medium hover:bg-gold/90 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Mode toggle + filters */}
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          {/* Search mode toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => {
                setMode("all");
                if (submittedQuery) setPage(1);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                mode === "all"
                  ? "bg-gold/15 text-gold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="h-3 w-3" />
              Search All
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("bible");
                if (submittedQuery) setPage(1);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                mode === "bible"
                  ? "bg-gold/15 text-gold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="h-3 w-3" />
              Bible Only
            </button>
          </div>

          {/* Translation filter (Bible mode only) */}
          {mode === "bible" && (
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex flex-wrap gap-1.5">
                {TRANSLATIONS.map((t) => (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => {
                      setTranslation(t.code);
                      if (submittedQuery) setPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                      translation === t.code
                        ? "bg-gold/15 text-gold"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {t.abbreviation}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse p-4 rounded-xl bg-card">
              <div className="h-3 bg-muted rounded w-1/4 mb-3" />
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* ==========================================
          GLOBAL SEARCH RESULTS  
          ========================================== */}
      {!isLoading && mode === "all" && globalResults && (
        <div className="space-y-8">
          {globalMeta && (
            <p className="text-sm text-muted-foreground">
              {globalMeta.totalResults} result
              {globalMeta.totalResults !== 1 ? "s" : ""} found across all
              sources
            </p>
          )}

          {/* Render each source category */}
          {(["bible", "dictionary", "strongs", "library"] as const).map(
            (source) => {
              const results = globalResults[source];
              if (!results || results.length === 0) return null;

              const Icon = SOURCE_ICONS[source];
              const colorClass = SOURCE_COLORS[source];
              const label = SOURCE_LABELS[source];

              return (
                <div key={source} className="animate-slide-up">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn("p-1.5 rounded-md", colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h2 className="text-sm font-semibold">{label}</h2>
                    <span className="text-xs text-muted-foreground">
                      ({results.length})
                    </span>
                  </div>

                  <div className="space-y-2 pl-1">
                    {results.map(
                      (
                        r: {
                          ref: string;
                          highlight: string;
                          sourceType: string;
                          book?: string;
                          chapter?: number;
                          verse?: number;
                          headword?: string;
                          strongsNumber?: string;
                          language?: string;
                          originalWord?: string;
                          bookSlug?: string;
                          bookTitle?: string;
                          chapterNumber?: number;
                        },
                        i: number
                      ) => {
                        let href = "#";
                        if (source === "bible" && r.book) {
                          href = `/bible/${r.book.toLowerCase().replace(/\s+/g, "-")}/${r.chapter}`;
                        } else if (source === "dictionary" && r.headword) {
                          href = `/dictionary`;
                        } else if (source === "strongs" && r.strongsNumber) {
                          href = `/strongs`;
                        } else if (source === "library" && r.bookSlug) {
                          href = `/library/${r.bookSlug}`;
                        }

                        return (
                          <Link
                            key={`${source}-${r.ref}-${i}`}
                            href={href}
                            className="block p-3 rounded-lg bg-card border border-border hover:border-gold/20 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-semibold text-gold">
                                {r.ref}
                              </span>
                              {source === "strongs" && r.language && (
                                <span
                                  className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                                    r.language === "greek"
                                      ? "bg-blue-500/10 text-blue-400"
                                      : "bg-emerald-500/10 text-emerald-400"
                                  )}
                                >
                                  {r.language}
                                </span>
                              )}
                            </div>
                            <p
                              className="font-scripture text-xs leading-relaxed line-clamp-2 [&_mark]:bg-gold/20 [&_mark]:text-foreground [&_mark]:rounded-sm [&_mark]:px-0.5"
                              dangerouslySetInnerHTML={{
                                __html: r.highlight,
                              }}
                            />
                          </Link>
                        );
                      }
                    )}
                  </div>
                </div>
              );
            }
          )}

          {globalMeta?.totalResults === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <SearchIcon className="h-10 w-10 mx-auto mb-4 opacity-30" />
              <p>No results found for &ldquo;{submittedQuery}&rdquo;</p>
              <p className="text-sm mt-2">
                Try different keywords or check your spelling.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          BIBLE-ONLY SEARCH RESULTS  
          ========================================== */}
      {!isLoading && mode === "bible" && submittedQuery && bibleResults.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <SearchIcon className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p>No results found for &ldquo;{submittedQuery}&rdquo;</p>
          <p className="text-sm mt-2">
            Try different keywords or another translation.
          </p>
        </div>
      )}

      {mode === "bible" && bibleResults.length > 0 && (
        <>
          {bibleMeta && (
            <p className="text-sm text-muted-foreground mb-4">
              {bibleMeta.total} result{bibleMeta.total !== 1 ? "s" : ""} found
              {bibleMeta.totalPages > 1 &&
                ` — Page ${bibleMeta.page} of ${bibleMeta.totalPages}`}
            </p>
          )}

          <div className="space-y-3">
            {bibleResults.map(
              (
                r: {
                  book: string;
                  chapter: number;
                  verse: number;
                  highlight: string;
                },
                i: number
              ) => {
                const bookSlug = r.book.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={`${r.book}-${r.chapter}-${r.verse}`}
                    href={`/bible/${bookSlug}/${r.chapter}`}
                    className="block p-4 rounded-xl bg-card border border-border hover:border-gold/20 hover:shadow-sm transition-all animate-slide-up"
                    style={{
                      animationDelay: `${i * 30}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-3.5 w-3.5 text-gold" />
                      <span className="text-xs font-semibold text-gold">
                        {r.book} {r.chapter}:{r.verse}
                      </span>
                    </div>
                    <p
                      className="font-scripture text-sm leading-relaxed [&_mark]:bg-gold/20 [&_mark]:text-foreground [&_mark]:rounded-sm [&_mark]:px-0.5"
                      dangerouslySetInnerHTML={{ __html: r.highlight }}
                    />
                  </Link>
                );
              }
            )}
          </div>

          {/* Pagination */}
          {bibleMeta && bibleMeta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg text-sm bg-muted hover:bg-accent transition-colors disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                {bibleMeta.page} / {bibleMeta.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(bibleMeta.totalPages, p + 1))
                }
                disabled={page >= bibleMeta.totalPages}
                className="px-4 py-2 rounded-lg text-sm bg-muted hover:bg-accent transition-colors disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
