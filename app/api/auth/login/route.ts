import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/login
 * Authenticate with email/password and set session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;
    const sql = getDbClient();

    // Look up user
    const rows = await sql`
      SELECT id, name, email, password_hash
      FROM users
      WHERE email = ${email}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash as string);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    await createSession({
      userId: user.id as string,
      email: user.email as string,
      name: user.name as string,
    });

    console.log(`[API /auth/login] Authenticated: email="${email}", id=${user.id}`);

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error("[API /auth/login] Error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate" },
      { status: 500 }
    );
  }
}
