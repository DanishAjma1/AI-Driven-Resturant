import { NextResponse } from "next/server";
import { prisma } from "@ember-grain/db";
import { signupSchema, apiSuccess, UserRole, type AuthUserDTO } from "@ember-grain/shared";
import { withErrorHandling, ValidationError } from "@/lib/api-handler";
import { hashPassword } from "@/lib/password";
import { signSession, sessionCookieOptions } from "@/lib/auth";

export const POST = withErrorHandling(async (request: Request) => {
  const body = signupSchema.parse(await request.json());

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    throw new ValidationError("An account with that email already exists.");
  }

  const passwordHash = await hashPassword(body.password);
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash,
      role: UserRole.CUSTOMER,
    },
  });

  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const dto: AuthUserDTO = { id: user.id, email: user.email, name: user.name, role: user.role };
  const res = NextResponse.json(apiSuccess(dto), { status: 201 });
  res.cookies.set(sessionCookieOptions.name, token, sessionCookieOptions);
  return res;
});
