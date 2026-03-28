import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { changePasswordSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/change-password
 * Changes the authenticated user's password (requires current password verification).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = changePasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validationResult.data;
    const sql = getDbClient();

    // Fetch current password hash — defense-in-depth: filter by user_id
    const rows = await sql`
      SELECT password_hash FROM users WHERE id = ${user.userId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash as string);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash the new password
    const newHash = await bcrypt.hash(newPassword, 12);

    // Update — defense-in-depth: WHERE id = user_id
    await sql`
      UPDATE users SET password_hash = ${newHash} WHERE id = ${user.userId}
    `;

    console.log(`[API /auth/change-password] Password changed: user_id=${user.userId}`);

    return NextResponse.json({
      data: { message: "Password changed successfully." },
    });
  } catch (error) {
    console.error("[API /auth/change-password] Error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
