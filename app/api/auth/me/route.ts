import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

/**
 * GET /api/auth/me
 * Returns the currently authenticated user from the session cookie.
 * Used by SWR on the client to check auth state.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({
      data: {
        userId: user.userId,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("[API /auth/me] Error:", error);
    return NextResponse.json({ error: "Session error" }, { status: 500 });
  }
}
