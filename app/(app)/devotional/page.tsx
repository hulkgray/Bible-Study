"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Calendar, BookOpen, MessageSquare } from "lucide-react";
import { VerseLinks } from "@/components/verse-links";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((res) => res.data ?? res);

export default function DevotionalPage() {
  const router = useRouter();
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
            <div
              className="text-gold text-sm font-medium mb-6 flex items-center gap-1.5"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <VerseLinks text={data.scriptureRef.trim()} />
            </div>
          )}
          <div className="font-scripture text-base leading-relaxed text-foreground/85 whitespace-pre-line">
            <VerseLinks text={data.content} />
          </div>
          <p className="text-sm text-muted-foreground mt-6 pt-4 border-t border-border">
            — {data.bookAuthor ?? "Charles H. Spurgeon"}
          </p>
          <Button
            onClick={() => {
              const prompt = `Expand on today's daily devotional from Faith's Checkbook by Spurgeon and provide a deeper Bible study:

Title: ${data.title ?? ""}
Scripture: ${data.scriptureRef?.trim() ?? ""}

"${data.content}"

Please:
1. Explain the Scripture passage in its original context
2. Highlight key theological themes Spurgeon draws out
3. Provide additional cross-references that deepen the theme
4. Offer a practical application for today`;
              router.push(`/study?prompt=${encodeURIComponent(prompt)}`);
            }}
            className="w-full mt-4 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 hover:border-gold/40 transition-all"
            variant="outline"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Study with AI ✦
          </Button>
        </div>
      )}
    </div>
  );
}
