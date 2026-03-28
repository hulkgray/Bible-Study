import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * POST /api/auth/reset-password
 * Resets the user's password using a valid, unexpired token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = validationResult.data;
    const sql = getDbClient();

    // Hash the provided token and look it up
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const rows = await sql`
      SELECT id, user_id, expires_at, used_at
      FROM password_reset_tokens
      WHERE token_hash = ${tokenHash}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    const resetToken = rows[0];

    // Check if already used
    if (resetToken.used_at) {
      return NextResponse.json(
        { error: "This reset link has already been used" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(resetToken.expires_at as string) < new Date()) {
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update the user's password
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE id = ${resetToken.user_id}
    `;

    // Mark the token as used
    await sql`
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE id = ${resetToken.id}
    `;

    console.log(`[API /auth/reset-password] Password reset: user_id=${resetToken.user_id}`);

    return NextResponse.json({
      data: { message: "Password has been reset successfully." },
    });
  } catch (error) {
    console.error("[API /auth/reset-password] Error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
