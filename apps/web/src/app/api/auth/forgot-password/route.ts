import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@ember-grain/db";
import { forgotPasswordSchema, apiSuccess } from "@ember-grain/shared";
import { withErrorHandling } from "@/lib/api-handler";
import { sendPasswordResetEmail } from "@/lib/email";
import { env } from "@/env";

const RESET_TOKEN_TTL_MINUTES = 30;

export const POST = withErrorHandling(async (request: Request) => {
  const body = forgotPasswordSchema.parse(await request.json());
  const user = await prisma.user.findUnique({ where: { email: body.email } });

  // Always return 200 regardless of whether the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  if (!user) {
    return NextResponse.json(apiSuccess({ sent: true }));
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  await sendPasswordResetEmail(user.email, resetUrl);

  return NextResponse.json(
    apiSuccess({
      sent: true,
      devResetUrl: env.NODE_ENV === "production" ? undefined : resetUrl,
    }),
  );
});
