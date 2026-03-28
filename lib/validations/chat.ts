import { z } from "zod";

/** POST /api/chat/sessions — create session body */
export const createChatSessionSchema = z.object({
  title: z.string().max(500).optional().default("New Conversation"),
  modelId: z.string().max(100).optional().default("anthropic/claude-opus-4.6"),
});
