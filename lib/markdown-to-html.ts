/**
 * Simple markdown → HTML converter for loading AI-exported notes into TiptapEditor.
 * Handles the common patterns the AI produces: headings, bold, italic, links,
 * blockquotes, lists, horizontal rules, and paragraphs.
 *
 * NOT a full markdown parser — just enough to get rich content into Tiptap.
 */
export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inBlockquote = false;

  const closeList = () => {
    if (inList) {
      html.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }
  };

  const closeBlockquote = () => {
    if (inBlockquote) {
      html.push("</blockquote>");
      inBlockquote = false;
    }
  };

  /** Convert inline markdown to HTML */
  const inlineFormat = (text: string): string => {
    return text
      // Bold+italic: ***text*** or ___text___
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      // Bold: **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      // Italic: *text* or _text_
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
      // Inline code: `text`
      .replace(/`(.+?)`/g, "<code>$1</code>")
      // Links: [text](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Citation brackets that aren't links: [Genesis 1:1] — keep as-is
      ;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      closeList();
      closeBlockquote();
      html.push("<hr>");
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      closeBlockquote();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      closeList();
      if (!inBlockquote) {
        html.push("<blockquote>");
        inBlockquote = true;
      }
      html.push(`<p>${inlineFormat(line.slice(2))}</p>`);
      continue;
    } else if (inBlockquote && line.trim() === "") {
      closeBlockquote();
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
    if (ulMatch) {
      closeBlockquote();
      if (inList !== "ul") {
        closeList();
        html.push("<ul>");
        inList = "ul";
      }
      html.push(`<li>${inlineFormat(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
    if (olMatch) {
      closeBlockquote();
      if (inList !== "ol") {
        closeList();
        html.push("<ol>");
        inList = "ol";
      }
      html.push(`<li>${inlineFormat(olMatch[1])}</li>`);
      continue;
    }

    // Empty line — close any open blocks
    if (line.trim() === "") {
      closeList();
      closeBlockquote();
      continue;
    }

    // Regular paragraph
    closeList();
    closeBlockquote();
    html.push(`<p>${inlineFormat(line)}</p>`);
  }

  closeList();
  closeBlockquote();

  return html.join("");
}
