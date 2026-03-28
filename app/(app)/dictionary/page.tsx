"use client";

import { useState } from "react";
import useSWR from "swr";
import { BookText, Search as SearchIcon, Menu } from "lucide-react";
import { VerseLinks } from "@/components/verse-links";
import { DictionaryIndexSidebar } from "@/components/dictionary-index-sidebar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DictionaryPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<"easton" | "webster1828">("easton");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Build the API URL based on active mode (search vs letter browse)
  const apiUrl = activeLetter
    ? `/api/dictionary?letter=${activeLetter}&source=${activeSource}&limit=100`
    : submittedQuery
      ? `/api/dictionary?q=${encodeURIComponent(submittedQuery)}&source=${activeSource}`
      : null;

  const { data, isLoading } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSubmittedQuery(query.trim());
      setActiveLetter(null);
    }
  };

  const handleLetterClick = (letter: string) => {
    setActiveLetter(letter === activeLetter ? null : letter);
    setSubmittedQuery("");
    setQuery("");
  };

  const results = data?.data ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Dictionary Index Sidebar */}
      <DictionaryIndexSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeLetter={activeLetter}
        onLetterClick={handleLetterClick}
        activeSource={activeSource}
        onSourceChange={setActiveSource}
      />

      {/* Header */}
      <div className="mb-6 animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-scripture font-semibold mb-1">
            Bible Dictionary
          </h1>
          <p className="text-muted-foreground text-sm">
            {activeSource === "easton" ? "Easton's Bible Dictionary" : "Webster's 1828 Dictionary"}
            {activeLetter && ` — Letter ${activeLetter}`}
          </p>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2.5 rounded-xl bg-card border border-border hover:border-gold/30 hover:bg-muted transition-all shadow-border-small"
          title="Open Dictionary Index"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8 animate-slide-up">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeSource === "easton"
                  ? "Look up a biblical term, person, or place..."
                  : "Search Webster's 1828 Dictionary..."
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
      </form>

      {/* Active state label */}
      {(activeLetter || submittedQuery) && !isLoading && results.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {activeLetter
              ? `Entries starting with "${activeLetter}" (${results.length})`
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
          <p className="text-sm">Tap the index button to browse by letter, or search above</p>
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
                <div className="font-scripture text-sm leading-relaxed text-foreground/85 wrap-break-word overflow-hidden">
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
