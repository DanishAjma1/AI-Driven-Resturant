import { NextResponse } from "next/server";
import { prisma } from "@ember-grain/db";
import { resetPasswordSchema, apiSuccess } from "@ember-grain/shared";
import { withErrorHandling, HttpError } from "@/lib/api-handler";
import { hashPassword } from "@/lib/password";

export const POST = withErrorHandling(async (request: Request) => {
  const body = resetPasswordSchema.parse(await request.json());

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: body.token },
  });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt.getTime() < Date.now()
  ) {
    throw new HttpError(400, "INVALID_TOKEN", "This reset link is invalid or has expired.");
  }

  const passwordHash = await hashPassword(body.password);

  await prisma.$transaction(async (tx) => {
    // Claim the token atomically. Without this conditional update, two
    // concurrent requests can both reset the password with one token.
    const claimed = await tx.passwordResetToken.updateMany({
      where: {
        id: resetToken.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    if (claimed.count !== 1) {
      throw new HttpError(400, "INVALID_TOKEN", "This reset link is invalid or has expired.");
    }

    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });
  });

  return NextResponse.json(apiSuccess({ reset: true }));
});
