import "server-only";
import { cookies } from "next/headers";
import type { AuthUserDTO } from "@ember-grain/shared";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/**
 * Reads and verifies the session cookie for the current request. Returns
 * `null` when there is no session or it fails verification — callers decide
 * whether that's an error (route handlers) or just "logged out" (pages).
 */
export async function getCurrentUser(): Promise<AuthUserDTO | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifySession(token);
  if (!claims) return null;

  return {
    id: claims.sub,
    email: claims.email,
    name: claims.name,
    role: claims.role,
  };
}
