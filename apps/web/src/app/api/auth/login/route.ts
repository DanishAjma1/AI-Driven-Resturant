import { NextResponse } from "next/server";
import { prisma } from "@ember-grain/db";
import { loginSchema, apiSuccess, type AuthUserDTO } from "@ember-grain/shared";
import { withErrorHandling, HttpError } from "@/lib/api-handler";
import { verifyPassword } from "@/lib/password";
import { signSession, sessionCookieOptions } from "@/lib/auth";

export const POST = withErrorHandling(async (request: Request) => {
  const body = loginSchema.parse(await request.json());

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  const valid = user ? await verifyPassword(body.password, user.passwordHash) : false;

  if (!user || !valid) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
  }

  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const dto: AuthUserDTO = { id: user.id, email: user.email, name: user.name, role: user.role };
  const res = NextResponse.json(apiSuccess(dto));
  res.cookies.set(sessionCookieOptions.name, token, sessionCookieOptions);
  return res;
});
