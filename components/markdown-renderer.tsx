"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * MarkdownRenderer — renders markdown content with Bible study-themed prose styles.
 * Used in Notes (AI exports) and potentially chat messages.
 */
export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-scripture font-bold mb-3 text-foreground">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-scripture font-semibold mb-2 text-foreground/90 border-b border-border/30 pb-1">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold mb-1.5 text-foreground/80">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-3 text-foreground/80">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-3 space-y-1 text-sm text-foreground/80">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm text-foreground/80">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-gold/40 pl-4 my-3 text-sm italic text-muted-foreground">
            {children}
          </blockquote>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-foreground/70">{children}</em>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <pre className="bg-muted/50 rounded-lg p-3 overflow-x-auto mb-3 border border-border/30">
              <code className="text-xs font-mono text-foreground/80">{children}</code>
            </pre>
          ) : (
            <code className="bg-muted/50 px-1.5 py-0.5 rounded text-xs font-mono text-gold/80">
              {children}
            </code>
          );
        },
        hr: () => <hr className="border-border/30 my-4" />,
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-gold hover:text-gold/80 underline underline-offset-2 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-xs border-collapse border border-border/30">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="bg-muted/30 px-3 py-1.5 text-left font-semibold border border-border/30 text-foreground/70">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-1.5 border border-border/30 text-foreground/80">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
