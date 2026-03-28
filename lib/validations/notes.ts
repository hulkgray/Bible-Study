import { z } from "zod";

/** POST /api/notes — create note body */
export const createNoteSchema = z.object({
  title: z.string().min(1).max(500).optional().default("Untitled Note"),
  content: z.any().optional().default({}),
  folderId: z.string().uuid().nullable().optional().default(null),
  color: z.string().max(20).optional().default("default"),
  links: z.array(z.object({
    type: z.enum(["verse", "dictionary", "strongs", "library", "devotional"]),
    ref: z.string(),
    href: z.string(),
  })).optional().default([]),
});

/** GET /api/notes — query params */
export const listNotesSchema = z.object({
  folderId: z.string().uuid().nullable().optional(),
  search: z.string().max(200).optional(),
});

/** PATCH /api/notes/[id] — update note body (id omitted per compliance) */
export const updateNoteSchema = createNoteSchema
  .extend({
    pinned: z.boolean().optional(),
  })
  .partial();

/** POST /api/notes/folders — create folder */
export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(200),
  parentId: z.string().uuid().nullable().optional().default(null),
  color: z.string().max(20).optional().default("default"),
});

/** PATCH /api/notes/folders/[id] — update folder (id omitted per compliance) */
export const updateFolderSchema = createFolderSchema.partial();
