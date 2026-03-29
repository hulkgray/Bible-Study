"use client";

import React from "react";
import useSWR from "swr";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { SmartTooltip } from "@/components/ui/smart-tooltip";

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((res) => res.data ?? res);

interface StrongsTooltipProps {
  strongsNumber: string;
  children: React.ReactNode;
  href: string;
  className?: string;
}

/**
 * StrongsTooltip — shows original word, transliteration, and definition
 * on hover (desktop) or tap (mobile) via the shared SmartTooltip.
 */
export function StrongsTooltip({
  strongsNumber,
  children,
  href,
  className,
}: StrongsTooltipProps) {
  const { data: entry } = useSWR(
    `/api/strongs/${encodeURIComponent(strongsNumber.toUpperCase())}`,
    fetcher,
    { dedupingInterval: 30000, revalidateOnFocus: false }
  );

  const isHebrew = strongsNumber.toUpperCase().startsWith("H");

  const content = entry ? (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
            isHebrew
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-blue-500/15 text-blue-400"
          )}
        >
          {isHebrew ? "Hebrew" : "Greek"}
        </span>
        <span className="text-gold font-mono font-bold text-sm">
          {strongsNumber.toUpperCase()}
        </span>
      </div>

      {entry.originalWord && (
        <div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Original Word
          </span>
          <p className="text-lg font-scripture leading-tight">{entry.originalWord}</p>
        </div>
      )}

      {entry.transliteration && (
        <div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Transliteration
          </span>
          <p className="text-sm italic">{entry.transliteration}</p>
        </div>
      )}

      {entry.pronunciation && (
        <p className="text-xs text-muted-foreground">{entry.pronunciation}</p>
      )}

      {entry.definition && (
        <div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Definition
          </span>
          <div className="tooltip-prose mt-1">
            <ReactMarkdown>{entry.definition.length > 300 ? entry.definition.slice(0, 300) + "…" : entry.definition}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-3.5 w-3.5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      Loading {strongsNumber.toUpperCase()}...
    </div>
  );

  return (
    <SmartTooltip
      content={content}
      href={href}
      ctaLabel="Read Full Entry →"
      headerIcon="🔤"
      headerText={strongsNumber.toUpperCase()}
      triggerClassName={cn(
        "font-mono text-xs px-1.5 py-0.5 rounded bg-gold/10 text-gold hover:bg-gold/20 transition-colors",
        className
      )}
    >
      {children}
    </SmartTooltip>
  );
}
