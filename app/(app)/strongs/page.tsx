"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Languages, Search as SearchIcon, BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerseLinks } from "@/components/verse-links";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Detects whether a query is a Strong's number (e.g., G25, H430)
 * or an English word to search definitions for.
 */
function isStrongsNumber(q: string): boolean {
  return /^[GHgh]\d{1,5}$/.test(q.trim());
}

function StrongsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  // Read ?q= param on page load (from AI chat links)
  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam && qParam.trim()) {
      const val = qParam.trim();
      setQuery(val);
      // Auto-submit. For Strong's numbers, uppercase it.
      setSubmittedQuery(isStrongsNumber(val) ? val.toUpperCase() : val);
    }
  }, [searchParams]);

  // If query is a Strong's number, do direct lookup; if it's an English word, search definitions
  const isNumber = submittedQuery ? isStrongsNumber(submittedQuery) : false;

  const numberSwrKey = isNumber && submittedQuery
    ? `/api/strongs/${encodeURIComponent(submittedQuery.toUpperCase())}`
    : null;

  const searchSwrKey = !isNumber && submittedQuery
    ? `/api/strongs/search?q=${encodeURIComponent(submittedQuery)}`
    : null;

  const { data: numberData, isLoading: numberLoading } = useSWR(
    numberSwrKey,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  const { data: searchData, isLoading: searchLoading } = useSWR(
    searchSwrKey,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  const isLoading = numberLoading || searchLoading;
  const entry = numberData?.data;
  const numberError = numberData?.error;
  const searchResults = searchData?.data ?? [];
  const searchError = searchData?.error;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const val = query.trim();
    const normalized = isStrongsNumber(val) ? val.toUpperCase() : val;
    setSubmittedQuery(normalized);
    // Sync URL for bookmarkability
    router.push(`/strongs?q=${encodeURIComponent(normalized)}`, { scroll: false });
  };

  // When a search result is clicked, load it directly
  const handleSelectEntry = (strongsNumber: string) => {
    setQuery(strongsNumber);
    setSubmittedQuery(strongsNumber);
    router.push(`/strongs?q=${encodeURIComponent(strongsNumber)}`, { scroll: false });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-scripture font-semibold mb-2">
          Strong&apos;s Concordance
        </h1>
        <p className="text-muted-foreground text-sm">
          Greek &amp; Hebrew word study — search by Strong&apos;s number or English word
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
              placeholder="Strong's number (H430, G25) or English word (love, grace)..."
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
          G = Greek (New Testament), H = Hebrew (Old Testament) · Or type an English word to search definitions
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

      {(numberError || searchError) && !isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <Languages className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p>{numberError || searchError}</p>
        </div>
      )}

      {/* Direct Strong's number result */}
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
            <div className="font-scripture text-sm leading-relaxed mt-1 text-foreground/90">
              <VerseLinks text={entry.definition} />
            </div>
          </div>

          {/* Related verses section */}
          {entry.verses && entry.verses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Used in Scripture
              </span>
              <div className="mt-2 space-y-2">
                {entry.verses.map((v: { book: string; chapter: number; verse: number; text: string }, i: number) => (
                  <Link
                    key={i}
                    href={`/bible/${v.book.toLowerCase().replace(/\s+/g, '-')}/${v.chapter}`}
                    className="block p-3 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/50 transition-colors group"
                  >
                    <span className="text-xs font-medium text-gold group-hover:text-gold/80">
                      {v.book} {v.chapter}:{v.verse}
                    </span>
                    <p className="text-sm text-foreground/70 mt-1 line-clamp-2">{v.text}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Find in Bible link */}
          <div className="mt-4 pt-4 border-t border-border">
            <Link
              href={`/search?q=${encodeURIComponent(entry.transliteration || entry.originalWord || submittedQuery)}`}
              className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Search in Bible
            </Link>
          </div>
        </div>
      )}

      {/* English word search results */}
      {!isNumber && searchResults.length > 0 && !isLoading && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-4">
            Found {searchResults.length} entries matching &ldquo;{submittedQuery}&rdquo;
          </p>
          {searchResults.map((r: {
            strongsNumber: string;
            language: string;
            originalWord: string;
            transliteration: string;
            definition: string;
          }) => (
            <button
              key={r.strongsNumber}
              onClick={() => handleSelectEntry(r.strongsNumber)}
              className="w-full text-left p-4 rounded-xl bg-card border border-border hover:border-gold/30 hover:bg-card/80 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    r.language === "greek"
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-emerald-500/15 text-emerald-400"
                  )}
                >
                  {r.language}
                </span>
                <span className="text-gold font-mono font-bold text-sm">
                  {r.strongsNumber}
                </span>
                {r.originalWord && (
                  <span className="text-foreground/60 text-sm font-scripture">
                    {r.originalWord}
                  </span>
                )}
                {r.transliteration && (
                  <span className="text-muted-foreground italic text-xs">
                    ({r.transliteration})
                  </span>
                )}
                <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm text-foreground/70 line-clamp-2">
                {r.definition}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* No results for text search */}
      {!isNumber && submittedQuery && searchResults.length === 0 && !searchError && !isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <Languages className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p>No Strong&apos;s entries found for &ldquo;{submittedQuery}&rdquo;</p>
          <p className="text-xs mt-2">Try a different English word or a Strong&apos;s number like H430 or G25</p>
        </div>
      )}
    </div>
  );
}

export default function StrongsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse p-6 rounded-xl bg-card">
          <div className="h-6 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-1/2 mb-3" />
          <div className="h-4 bg-muted rounded w-full mb-2" />
          <div className="h-4 bg-muted rounded w-4/5" />
        </div>
      </div>
    }>
      <StrongsContent />
    </Suspense>
  );
}
