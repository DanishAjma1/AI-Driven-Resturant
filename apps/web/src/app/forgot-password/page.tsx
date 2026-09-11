"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Something went wrong.");
      setSent(true);
      setDevResetUrl(json.data?.devResetUrl ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20">
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl">Check your email</h1>
        <p className="text-sm text-[var(--color-text-dim)]">
          If an account exists for {email}, we&apos;ve sent a reset link. It expires in
          30 minutes.
        </p>
        {devResetUrl && (
          <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
            <p className="mb-2 text-[var(--color-text-faint)]">
              No email provider is wired up in this environment, so here&apos;s the link
              directly:
            </p>
            <Link href={devResetUrl} className="break-all text-[var(--color-ember)]">
              {devResetUrl}
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl">Reset password</h1>
      <p className="mb-8 text-sm text-[var(--color-text-dim)]">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-ember)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-ember)] py-2.5 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send reset link
        </button>
      </form>
      <p className="mt-5 text-sm text-[var(--color-text-dim)]">
        <Link href="/login" className="text-[var(--color-ember)]">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
