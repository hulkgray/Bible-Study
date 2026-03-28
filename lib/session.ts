import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "bible_session";
const EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Returns the JWT secret key, encoded for jose.
 * Falls back to a dev-only key if JWT_SECRET is not set.
 */
function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("[Session] JWT_SECRET is not configured. Add it to .env.local");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Signs a new JWT and sets it as an httpOnly cookie.
 * Called after successful login or signup.
 */
export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${EXPIRY_SECONDS}s`)
    .setIssuedAt()
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: EXPIRY_SECONDS,
    path: "/",
  });

  return token;
}

/**
 * Reads the session cookie and verifies the JWT.
 * Returns the session payload or null if invalid/missing.
 *
 * This is the ONLY way API routes and server components access the user.
 */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecretKey());
    
    // Validate required fields exist
    if (!payload.userId || !payload.email || !payload.name) {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    // Expired, malformed, or forged token — treat as unauthenticated
    return null;
  }
}

/**
 * Clears the session cookie (logout).
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
