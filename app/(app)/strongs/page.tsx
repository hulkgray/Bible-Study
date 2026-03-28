"use client";

import { useState } from "react";
import useSWR from "swr";
import { Languages, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StrongsPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const { data, isLoading, error } = useSWR(
    submittedQuery ? `/api/strongs/${encodeURIComponent(submittedQuery)}` : null,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSubmittedQuery(query.trim().toUpperCase());
  };

  const entry = data?.data;
  const notFound = data?.error;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-scripture font-semibold mb-2">
          Strong&apos;s Concordance
        </h1>
        <p className="text-muted-foreground text-sm">
          Greek & Hebrew word study from James Strong&apos;s concordance
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
              placeholder="Enter a Strong's number (e.g., G25, H430)..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-gold text-gold-foreground text-sm font-medium hover:bg-gold/90 transition-colors"
          >
            Lookup
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 pl-1">
          G = Greek (New Testament), H = Hebrew (Old Testament)
        </p>
      </form>

      {isLoading && (
        <div className="animate-pulse p-6 rounded-xl bg-card">
          <div className="h-6 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-1/2 mb-3" />
          <div className="h-4 bg-muted rounded w-full mb-2" />
          <div className="h-4 bg-muted rounded w-4/5" />
        </div>
      )}

      {notFound && (
        <div className="text-center py-16 text-muted-foreground">
          <Languages className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p>{notFound}</p>
        </div>
      )}

      {entry && (
        <div className="p-6 rounded-xl bg-card border border-border animate-scale-in">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-bold uppercase",
                entry.language === "greek"
                  ? "bg-blue-500/15 text-blue-400"
                  : "bg-emerald-500/15 text-emerald-400"
              )}
            >
              {entry.language}
            </span>
            <span className="text-gold font-mono font-bold text-lg">
              {entry.strongsNumber}
            </span>
          </div>

          {entry.originalWord && (
            <div className="mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Original Word
              </span>
              <p className="text-2xl font-scripture mt-1">{entry.originalWord}</p>
            </div>
          )}

          {entry.transliteration && (
            <div className="mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Transliteration
              </span>
              <p className="text-lg italic mt-1">{entry.transliteration}</p>
            </div>
          )}

          {entry.pronunciation && (
            <div className="mb-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Pronunciation
              </span>
              <p className="text-sm text-muted-foreground mt-1">
                {entry.pronunciation}
              </p>
            </div>
          )}

          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Definition
            </span>
            <p className="font-scripture text-sm leading-relaxed mt-1 text-foreground/90">
              {entry.definition}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
