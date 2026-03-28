import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { passwordResetRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email if the email exists.
 * Always returns 200 to prevent email enumeration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = forgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Rate limit: 3 requests per email per hour
    if (passwordResetRateLimit) {
      const { success } = await passwordResetRateLimit.limit(email);
      if (!success) {
        // Still return 200 to not leak info, but don't send email
        console.warn(`[API /auth/forgot-password] Rate limited: email="${email}"`);
        return NextResponse.json({
          data: { message: "If an account with that email exists, a reset link has been sent." },
        });
      }
    }

    const sql = getDbClient();

    // Look up user — if not found, still return 200 (prevent enumeration)
    const rows = await sql`SELECT id FROM users WHERE email = ${email}`;

    if (rows.length > 0) {
      const userId = rows[0].id as string;

      // Generate a secure random token
      const rawToken = crypto.randomBytes(32).toString("hex");

      // Hash the token before storing (so DB compromise doesn't leak tokens)
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      // Expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Store hashed token
      await sql`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (${userId}, ${tokenHash}, ${expiresAt.toISOString()})
      `;

      // Build reset URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

      // Send email via Resend
      try {
        await sendPasswordResetEmail(email, resetUrl);
        console.log(`[API /auth/forgot-password] Reset email sent: email="${email}"`);
      } catch (emailError) {
        console.error("[API /auth/forgot-password] Failed to send email:", emailError);
        // Don't expose email delivery failures to the user
      }
    } else {
      console.log(`[API /auth/forgot-password] No user found for email="${email}" (silent)`);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      data: { message: "If an account with that email exists, a reset link has been sent." },
    });
  } catch (error) {
    console.error("[API /auth/forgot-password] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
