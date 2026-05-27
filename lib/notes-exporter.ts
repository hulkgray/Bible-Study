import { parseCitations, extractSourceFooter } from "@/lib/citation-parser";

/**
 * Export assistant response to a new study note.
 * Resolves with true if successfully exported, false otherwise.
 */
export async function exportToNote(text: string): Promise<boolean> {
  try {
    // Extract title from first heading (# or ##), fallback to first line
    const headingMatch = text.match(/^#{1,3}\s+(.+)$/m);
    const title = headingMatch
      ? headingMatch[1].replace(/[#*_\[\]]/g, "").trim()
      : text.substring(0, 60).replace(/[#*_]/g, "").trim() + "...";

    // Auto-extract citation links from the markdown text
    const citations = parseCitations(text);
    const links = extractSourceFooter(citations).map((s) => ({
      type: s.type === "📖" ? "verse" : s.type === "🔤" ? "strongs" : "dictionary",
      ref: s.display,
      href: s.href,
    }));

    // Store raw markdown — TiptapEditor will parse it via @tiptap/markdown
    const tiptapContent = {
      markdown: text,
    };

    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content: tiptapContent,
        links,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("[NotesExporter] Export to note failed:", err);
    return false;
  }
}
