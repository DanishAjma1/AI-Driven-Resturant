import { Resend } from "resend";
import { env } from "@/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  if (!resend || !env.EMAIL_FROM) {
    throw new Error(
      "Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM before sending password-reset emails.",
    );
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [to],
    subject: "Reset your Ember Grain password",
    text: `Reset your password: ${resetUrl}`,
    html: `
      <p>Hello,</p>
      <p>Use the link below to reset your Ember Grain password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 30 minutes.</p>
    `,
  });
}
