/**
 * Remark plugin that transforms bracketed Bible citations in markdown into
 * actual links. This lets Streamdown render them as interactive <a> tags
 * that we can then override via the `components` prop.
 *
 * Examples:
 *   [Genesis 1:1]  → [Genesis 1:1](/bible/genesis/1)
 *   [H430]         → [H430](/strongs?q=H430)
 *   [dict:Covenant] → [Covenant](/dictionary?q=Covenant)
 */
import { visit } from "unist-util-visit";
import type { Root, Text } from "mdast";
import { parseCitations } from "@/lib/citation-parser";

export function remarkCitations() {
  return function transformer(tree: Root) {
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined) return;

      const text = node.value;
      const citations = parseCitations(text);
      if (citations.length === 0) return;

      // Build new children array replacing text with interleaved text + link nodes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newChildren: any[] = [];
      let lastEnd = 0;

      for (const c of citations) {
        // Text before citation
        if (c.start > lastEnd) {
          newChildren.push({ type: "text", value: text.slice(lastEnd, c.start) });
        }

        // Citation as a link node
        newChildren.push({
          type: "link",
          url: c.href,
          title: `citation:${c.type}`,
          children: [{ type: "text", value: c.display }],
          data: {
            hProperties: {
              "data-citation-type": c.type,
              "data-citation-ref": c.display,
            },
          },
        });

        lastEnd = c.end;
      }

      // Remaining text
      if (lastEnd < text.length) {
        newChildren.push({ type: "text", value: text.slice(lastEnd) });
      }

      // Replace the text node with our mixed nodes
      parent.children.splice(index, 1, ...newChildren);

      // Return the new index to skip the nodes we just inserted
      return index + newChildren.length;
    });
  };
}
