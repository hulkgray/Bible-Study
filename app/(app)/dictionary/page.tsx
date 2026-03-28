"use client";

import { useState } from "react";
import useSWR from "swr";
import { BookText, Search as SearchIcon } from "lucide-react";
import { VerseLinks } from "@/components/verse-links";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DictionaryPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const { data, isLoading } = useSWR(
    submittedQuery ? `/api/dictionary?q=${encodeURIComponent(submittedQuery)}` : null,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSubmittedQuery(query.trim());
  };

  const results = data?.data ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-scripture font-semibold mb-2">
          Bible Dictionary
        </h1>
        <p className="text-muted-foreground text-sm">
          Easton&apos;s Bible Dictionary — 1,210 pages of biblical reference
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8 animate-slide-up">
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

      {!isLoading && submittedQuery && results.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookText className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p>No entries found for &ldquo;{submittedQuery}&rdquo;</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map(
            (entry: { id: string; headword: string; definition: string }, i: number) => (
              <div
                key={entry.id}
                className="p-5 rounded-xl bg-card border border-border animate-slide-up"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
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
