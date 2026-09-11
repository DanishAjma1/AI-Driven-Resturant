import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@ember-grain/shared";
import { env } from "@/env";

export const SESSION_COOKIE = "eg_session";
const SESSION_TTL_SECONDS = 60 * 60; // 1 hour

export interface SessionClaims {
  sub: string; // user id
  email: string;
  name: string;
  role: UserRole;
}

const secretKey = new TextEncoder().encode(env.JWT_SECRET);

/**
 * Signs a session JWT. Safe to call from Node runtime route handlers only
 * (uses the same `jose` primitives the edge middleware verifies with).
 */
export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Verifies a session JWT. Runs in both the Edge middleware and Node route
 * handlers — `jose` supports both runtimes, unlike `jsonwebtoken`.
 */
export async function verifySession(
  token: string,
): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (
      typeof payload.sub === "string" &&
      typeof payload.email === "string" &&
      typeof payload.name === "string" &&
      typeof payload.role === "string"
    ) {
      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role as UserRole,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  name: SESSION_COOKIE,
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
