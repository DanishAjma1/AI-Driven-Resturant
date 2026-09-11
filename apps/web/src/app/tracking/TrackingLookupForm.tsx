"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function TrackingLookupForm() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/tracking/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Order code, e.g. EG-1048"
        className="flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-ember)]"
      />
      <button
        type="submit"
        className="flex items-center gap-2 rounded-full bg-[var(--color-ember)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)]"
      >
        <Search className="h-4 w-4" />
        Track
      </button>
    </form>
  );
}
