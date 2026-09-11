"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Couldn't reset your password.");
      toast.success("Password reset — sign in with your new password.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't reset your password.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-sm text-[var(--color-text-dim)]">
        This reset link is missing a token.{" "}
        <Link href="/forgot-password" className="text-[var(--color-ember)]">
          Request a new one
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl">Set a new password</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min. 8 characters)"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-ember)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-ember)] py-2.5 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Reset password
        </button>
      </form>
    </div>
  );
}
