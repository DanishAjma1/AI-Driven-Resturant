import type { AuthUserDTO, UserRole } from "@ember-grain/shared";
import { getCurrentUser } from "@/lib/session";
import { ForbiddenError, UnauthorizedError } from "@/lib/api-handler";

export async function requireUser(): Promise<AuthUserDTO> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRole(
  roles: UserRole[],
): Promise<AuthUserDTO> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new ForbiddenError();
  }
  return user;
}
