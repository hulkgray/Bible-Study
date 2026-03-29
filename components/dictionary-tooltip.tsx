"use client";

import React from "react";
import useSWR from "swr";
import ReactMarkdown from "react-markdown";
import { SmartTooltip } from "@/components/ui/smart-tooltip";

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((res) => res.data ?? res);

interface DictionaryTooltipProps {
  term: string;
  children: React.ReactNode;
  href: string;
  className?: string;
}

/**
 * DictionaryTooltip — shows the Easton's Bible Dictionary definition
 * on hover (desktop) or tap (mobile) via the shared SmartTooltip.
 */
export function DictionaryTooltip({
  term,
  children,
  href,
  className,
}: DictionaryTooltipProps) {
  const { data } = useSWR(
    `/api/dictionary?q=${encodeURIComponent(term)}&source=easton&limit=1`,
    fetcher,
    { dedupingInterval: 30000, revalidateOnFocus: false }
  );

  // The API returns { data: [...] } — the SWR fetcher unwraps to [...].
  // IMPORTANT: Don't use `data?.entries` — Array.prototype.entries is a built-in
  // method that's truthy, which would prevent the ?? fallback from triggering.
  const entry = Array.isArray(data) ? data[0] : data?.[0];

  const content = entry ? (
    <div className="space-y-2">
      <div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Easton&apos;s Bible Dictionary
        </span>
        <p className="text-base font-scripture font-semibold mt-0.5">{entry.headword}</p>
      </div>
      <div className="tooltip-prose">
        <ReactMarkdown>
          {entry.definition.length > 400 ? entry.definition.slice(0, 400) + "…" : entry.definition}
        </ReactMarkdown>
      </div>
    </div>
  ) : data !== undefined ? (
    <p className="text-sm text-muted-foreground italic">
      No dictionary entry found for &ldquo;{term}&rdquo;.
    </p>
  ) : (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-3.5 w-3.5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      Looking up &ldquo;{term}&rdquo;...
    </div>
  );

  return (
    <SmartTooltip
      content={content}
      href={href}
      ctaLabel="Read Full Definition →"
      headerIcon="📚"
      headerText={term}
      triggerClassName={`text-gold hover:text-gold/80 underline decoration-dotted decoration-gold/30 hover:decoration-gold/60 transition-colors ${className || ""}`}
    >
      {children}
    </SmartTooltip>
  );
}
