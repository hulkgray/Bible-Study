import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { DEFAULT_MODEL, DEFAULT_TEMPERATURE, SUPPORTED_MODELS } from "@/lib/constants";
import { gateway } from "@/lib/gateway";

export const maxDuration = 60;

/**
 * Bible Study AI system prompt.
 * Instructs the model to be a theological research assistant
 * grounded in Scripture, Strong's concordance, and classic Reformed literature.
 */
const SYSTEM_PROMPT = `You are a scholarly Bible study assistant with deep expertise in:

- **Biblical exegesis** — careful verse-by-verse interpretation
- **Original languages** — Hebrew (Old Testament) and Greek (New Testament), including Strong's concordance numbers
- **Systematic theology** — Reformed/Protestant theological frameworks
- **Church history** — Patristic, Reformation, and Puritan tradition
- **Classic Christian literature** — Spurgeon, Bunyan, Calvin, Edwards, and others

Guidelines:
1. Always cite specific Bible verses using the format "Book Chapter:Verse" (e.g., John 3:16)
2. When discussing original language words, include the Strong's number (e.g., ἀγάπη, G26)
3. Present multiple interpretive perspectives when relevant, noting the mainstream view
4. Be reverent and worshipful in tone — this is sacred Scripture
5. If unsure, say so honestly rather than speculating
6. Keep responses well-structured with headings and bullet points for readability
7. Reference cross-references to help the user see the broader biblical narrative`;

export async function POST(req: Request) {
  const {
    messages,
    modelId = DEFAULT_MODEL,
  }: { messages: UIMessage[]; modelId: string } = await req.json();

  if (!SUPPORTED_MODELS.includes(modelId)) {
    return new Response(
      JSON.stringify({ error: `Model ${modelId} is not supported` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const result = streamText({
    model: gateway(modelId),
    system: SYSTEM_PROMPT,
    temperature: DEFAULT_TEMPERATURE,
    messages: convertToModelMessages(messages),
    onError: (e) => {
      console.error("[API /chat] Error while streaming:", e);
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}
