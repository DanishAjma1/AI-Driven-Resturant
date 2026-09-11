"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      console.log("json", json);
      if (!json.ok) throw new Error(json.error?.message ?? "Couldn't sign in.");

      const targetRoute =
        json?.data?.role === "COOK"
          ? "/portal/kitchen"
          : json?.data?.role === "DRIVER"
            ? "/portal/driver"
            : json?.data?.role === "ADMIN"
              ? "/admin/dashboard"
              : (searchParams.get("next") ?? "/");

      router.replace(targetRoute);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl">
        Sign in
      </h1>
      <p className="mb-8 text-sm text-[var(--color-text-dim)]">
        Demo accounts all use password{" "}
        <code className="text-[var(--color-grain)]">password123</code> — try
        admin@embergrain.dev, cook@embergrain.dev or driver@embergrain.dev.
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
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-ember)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-ember)] py-2.5 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </button>
      </form>
      <div className="mt-5 flex justify-between text-sm text-[var(--color-text-dim)]">
        <Link
          href="/forgot-password"
          className="hover:text-[var(--color-ember)]"
        >
          Forgot password?
        </Link>
        <Link href="/signup" className="hover:text-[var(--color-ember)]">
          Create an account
        </Link>
      </div>
    </div>
  );
}
