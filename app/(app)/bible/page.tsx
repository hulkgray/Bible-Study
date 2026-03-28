"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import { BibleIndexSidebar } from "@/components/bible-index-sidebar";

/**
 * /bible index page — shows the Bible index sidebar over a landing view.
 * User can pick a book/chapter, or they'll see a clean welcome state.
 */
export default function BibleIndexPage() {
  const router = useRouter();
  const [showIndex, setShowIndex] = useState(true);

  // If user closes the sidebar without picking a book, go to Genesis 1
  useEffect(() => {
    if (!showIndex) {
      router.push("/bible/genesis/1");
    }
  }, [showIndex, router]);

  const otBooks = BIBLE_BOOKS.filter((b) => b.testament === "OT");
  const ntBooks = BIBLE_BOOKS.filter((b) => b.testament === "NT");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-fade-in">
      <BibleIndexSidebar
        isOpen={showIndex}
        onClose={() => setShowIndex(false)}
      />

      <BookOpen className="h-12 w-12 text-gold mb-4" />
      <h1 className="text-3xl md:text-4xl font-scripture font-semibold text-center">
        The Holy Bible
      </h1>
      <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
        {otBooks.length + ntBooks.length} books across the Old and New Testaments.
        Select a book from the panel to begin reading.
      </p>
      <button
        onClick={() => setShowIndex(true)}
        className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 transition-all"
      >
        Open Book Index
      </button>
    </div>
  );
}
