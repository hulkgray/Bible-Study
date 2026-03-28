"use client";

import { useState } from "react";
import useSWR from "swr";
import { BookText, Search as SearchIcon } from "lucide-react";
import { VerseLinks } from "@/components/verse-links";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function DictionaryPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // Build the API URL based on active mode (search vs letter browse)
  const apiUrl = activeLetter
    ? `/api/dictionary?letter=${activeLetter}&limit=100`
    : submittedQuery
      ? `/api/dictionary?q=${encodeURIComponent(submittedQuery)}`
      : null;

  const { data, isLoading } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSubmittedQuery(query.trim());
      setActiveLetter(null); // Clear letter when searching
    }
  };

  const handleLetterClick = (letter: string) => {
    setActiveLetter(letter === activeLetter ? null : letter);
    setSubmittedQuery(""); // Clear search when browsing by letter
    setQuery("");
  };

  const results = data?.data ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-scripture font-semibold mb-2">
          Bible Dictionary
        </h1>
        <p className="text-muted-foreground text-sm">
          Easton&apos;s Bible Dictionary — 1,210 pages of biblical reference
        </p>
      </div>

      {/* A–Z Letter Bar */}
      <div className="mb-6 animate-slide-up relative">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-2">
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              className={cn(
                "shrink-0 w-9 h-9 rounded-lg text-sm font-medium transition-all duration-150",
                activeLetter === letter
                  ? "bg-gold text-gold-foreground shadow-border-small scale-105"
                  : "bg-card border border-border hover:bg-muted hover:border-gold/30 text-foreground/70 hover:text-foreground"
              )}
            >
              {letter}
            </button>
          ))}
        </div>
        {/* Right fade hint for horizontal scroll */}
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-linear-to-l from-background to-transparent pointer-events-none md:hidden" />
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Look up a biblical term, person, or place..."
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
      </form>

      {/* Active state label */}
      {(activeLetter || submittedQuery) && !isLoading && results.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {activeLetter
              ? `Showing entries starting with "${activeLetter}" (${results.length})`
              : `Results for "${submittedQuery}" (${results.length})`}
          </p>
          <button
            onClick={() => {
              setActiveLetter(null);
              setSubmittedQuery("");
              setQuery("");
            }}
            className="text-xs text-gold hover:text-gold/80 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse p-5 rounded-xl bg-card">
              <div className="h-4 bg-muted rounded w-1/4 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-5/6" />
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && (submittedQuery || activeLetter) && results.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookText className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p>
            {activeLetter
              ? `No entries found starting with "${activeLetter}"`
              : `No entries found for "${submittedQuery}"`}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !submittedQuery && !activeLetter && (
        <div className="text-center py-16 text-muted-foreground animate-fade-in">
          <BookText className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Select a letter or search to browse the dictionary</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map(
            (entry: { id: string; headword: string; definition: string }, i: number) => (
              <div
                key={entry.id}
                className="p-5 rounded-xl bg-card border border-border animate-slide-up"
                style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
              >
                <h3 className="text-gold font-semibold text-lg mb-2">
                  {entry.headword}
                </h3>
                <div className="font-scripture text-sm leading-relaxed text-foreground/85">
                  <VerseLinks text={entry.definition} />
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
