import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

/**
 * POST /api/auth/logout
 * Clear the session cookie.
 */
export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("[API /auth/logout] Error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}
