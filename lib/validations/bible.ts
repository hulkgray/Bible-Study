import { z } from "zod";

/** GET /api/bible/[book]/[chapter] — query params */
export const chapterQuerySchema = z.object({
  translations: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((t) => t.trim().toLowerCase()) : ["kjv"])),
});

/** GET /api/bible/search — query params */
export const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(200),
  translation: z.string().optional().default("kjv"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/** GET /api/dictionary — query params */
export const dictionaryQuerySchema = z.object({
  q: z.string().min(1).max(200).optional(),
  letter: z.string().length(1).regex(/^[a-zA-Z]$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
}).refine((data) => data.q || data.letter, {
  message: "Either 'q' or 'letter' must be provided",
});


/** GET /api/strongs/[number] — params */
export const strongsParamSchema = z.object({
  number: z
    .string()
    .regex(/^[GHgh]\d{1,5}$/, "Must be a Strong's number like G25 or H430"),
});

/** POST /api/chat — request body (extends base) */
export const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ),
  modelId: z.string().optional(),
});
