"use client";

import { useState } from "react";
import { X, BookOpenText, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROMPT_TEMPLATES,
  PROMPT_CATEGORIES,
  type PromptCategory,
  type PromptTemplate,
} from "@/lib/prompt-templates";

interface PromptLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (template: string) => void;
}

export function PromptLibrary({ isOpen, onClose, onSelectPrompt }: PromptLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<PromptCategory | "all">("all");
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = PROMPT_TEMPLATES.filter((t) => {
    const matchesCategory = activeCategory === "all" || t.category === activeCategory;
    const matchesSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function handleSelect(template: PromptTemplate) {
    onSelectPrompt(template.template);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] mx-4 bg-card border border-border rounded-2xl shadow-2xl flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpenText className="h-5 w-5 text-gold" />
            <h2 className="text-lg font-semibold">Prompt Library</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-6 py-3 border-b border-border">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                activeCategory === "all"
                  ? "bg-gold/15 text-gold"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              All
            </button>
            {PROMPT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  activeCategory === cat.id
                    ? "bg-gold/15 text-gold"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt list */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2 hide-scrollbar">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No prompts found.
            </p>
          )}
          {filtered.map((template) => {
            const cat = PROMPT_CATEGORIES.find((c) => c.id === template.category);
            return (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className="w-full text-left p-4 rounded-xl border border-border/50 hover:border-gold/30 hover:bg-gold/5 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover:text-gold transition-colors">
                      {template.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {template.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground/60 shrink-0">
                    {cat?.emoji}
                  </span>
                </div>
                <p className="text-xs text-foreground/50 mt-2 font-mono truncate">
                  {template.template}
                </p>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Click a prompt to insert it into the chat. Edit the {"{placeholders}"} before sending.
          </p>
        </div>
      </div>
    </div>
  );
}
