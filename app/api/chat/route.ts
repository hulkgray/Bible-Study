import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { NextRequest } from "next/server";
import { after } from "next/server";
import { DEFAULT_MODEL, DEFAULT_TEMPERATURE, SUPPORTED_MODELS } from "@/lib/constants";
import { gateway } from "@/lib/gateway";
import { getCurrentUser } from "@/lib/session";
import { aiRateLimit } from "@/lib/rate-limit";
import { logTokenUsage } from "@/lib/ai-usage";

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
1. Always cite specific Bible verses using bracketed format: [Genesis 1:1], [John 3:16], [1 Corinthians 13:4-7]. These will be rendered as clickable links for the user.
2. When discussing original language words, include the Strong's number in brackets: [H430] for Hebrew, [G26] for Greek. Example: "The word ἀγάπη [G26] means unconditional love."
3. When referencing biblical concepts or terms the user can look up, use: [dict:Covenant], [dict:Tabernacle], [dict:Atonement].
4. Present multiple interpretive perspectives when relevant, noting the mainstream view.
5. Be reverent and worshipful in tone — this is sacred Scripture.
6. If unsure, say so honestly rather than speculating.
7. Keep responses well-structured with headings and bullet points for readability.
8. Reference cross-references to help the user see the broader biblical narrative.
9. Ground every theological claim in specific Scripture citations — never make assertions without verse references.`;

export async function POST(req: NextRequest) {
  // Authentication — checklist item 1
  const user = await getCurrentUser();
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Rate limiting — checklist item 12
  if (aiRateLimit) {
    const { success, remaining } = await aiRateLimit.limit(user.userId);
    if (!success) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a moment before trying again." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": String(remaining),
          },
        }
      );
    }
  }

  const {
    messages,
    modelId = DEFAULT_MODEL,
    sessionId,
  }: { messages: UIMessage[]; modelId: string; sessionId?: string } = await req.json();

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
    onFinish: async ({ usage, totalUsage }) => {
      // Use totalUsage (multi-step aggregate) if available, else fall back to step usage
      const u = totalUsage ?? usage;
      console.log("[API /chat] onFinish usage:", JSON.stringify(u));

      // Schedule the DB write via after() so Vercel doesn't kill the function
      // before the async write completes
      after(async () => {
        await logTokenUsage({
          userId: user.userId,
          modelId,
          promptTokens: u.inputTokens ?? 0,
          completionTokens: u.outputTokens ?? 0,
          sessionId,
        });
      });
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}

