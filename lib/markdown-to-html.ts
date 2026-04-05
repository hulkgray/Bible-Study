import { marked } from "marked";

/**
 * Convert markdown to HTML using the `marked` library.
 * Used to load AI-exported notes (stored as markdown) into TiptapEditor
 * which natively understands HTML.
 *
 * Handles all standard markdown: headings, bold, italic, links, tables,
 * lists, blockquotes, code blocks, horizontal rules, etc.
 */
export function markdownToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}
