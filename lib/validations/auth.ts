import { z } from "zod";

/** POST /api/auth/signup — request body */
export const signupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be under 200 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(320, "Email must be under 320 characters")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be under 128 characters"),
});

/** POST /api/auth/login — request body */
export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

/** POST /api/auth/forgot-password — request body */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .transform((v) => v.toLowerCase().trim()),
});

/** POST /api/auth/reset-password — request body */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be under 128 characters"),
});

/** POST /api/auth/change-password — request body */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "Password must be under 128 characters"),
});

/** POST /api/bookmarks — request body */
export const bookmarkToggleSchema = z.object({
  book: z.string().min(1, "Book name is required"),
  bookNumber: z.coerce.number().int().positive(),
  chapter: z.coerce.number().int().positive(),
  verse: z.coerce.number().int().positive(),
  translationCode: z.string().max(10).optional().default("kjv"),
});

/** GET /api/bookmarks — query params */
export const bookmarkQuerySchema = z.object({
  book_number: z.coerce.number().int().positive().optional(),
  chapter: z.coerce.number().int().positive().optional(),
});
