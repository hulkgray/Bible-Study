"use client";

import useSWR from "swr";
import { Calendar, BookOpen } from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((res) => res.data ?? res);

export default function DevotionalPage() {
  const { data, isLoading } = useSWR("/api/devotional/today", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-scripture font-semibold mb-2">
          Daily Devotional
        </h1>
        <p className="text-muted-foreground text-sm">
          Faith&apos;s Checkbook by Charles H. Spurgeon
        </p>
      </div>

      <div className="flex items-center gap-2 text-gold text-sm font-medium mb-6 animate-slide-up">
        <Calendar className="h-4 w-4" />
        <span>{dateStr}</span>
      </div>

      {isLoading && (
        <div className="animate-pulse p-8 rounded-2xl bg-card">
          <div className="h-5 bg-muted rounded w-2/3 mb-4" />
          <div className="h-3 bg-muted rounded w-1/3 mb-6" />
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>
      )}

      {!isLoading && !data && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p>No devotional available for today.</p>
          <p className="text-sm mt-2">
            Run the ETL seed scripts to populate the database with Faith&apos;s Checkbook.
          </p>
        </div>
      )}

      {data && (
        <div className="p-8 rounded-2xl bg-card border border-border animate-scale-in">
          {data.title && (
            <h2 className="font-scripture text-xl font-semibold mb-2">
              {data.title}
            </h2>
          )}
          {data.scriptureRef && (
            <p className="text-gold text-sm font-medium mb-6 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {data.scriptureRef}
            </p>
          )}
          <div className="font-scripture text-base leading-relaxed text-foreground/85 whitespace-pre-line">
            {data.content}
          </div>
          <p className="text-sm text-muted-foreground mt-6 pt-4 border-t border-border">
            — {data.bookAuthor ?? "Charles H. Spurgeon"}
          </p>
        </div>
      )}
    </div>
  );
}
