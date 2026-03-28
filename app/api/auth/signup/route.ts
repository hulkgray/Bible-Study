import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { createSession } from "@/lib/session";
import { signupSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/signup
 * Create a new user account and set session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;
    const sql = getDbClient();

    // Check if email already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password (bcrypt, 12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const rows = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id, name, email, created_at
    `;

    const user = rows[0];

    // Create session
    await createSession({
      userId: user.id as string,
      email: user.email as string,
      name: user.name as string,
    });

    console.log(`[API /auth/signup] Created user: email="${email}", id=${user.id}`);

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[API /auth/signup] Error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
