import Image from "next/image";
import { Flame, Leaf, Clock } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="mb-4 font-[family-name:var(--font-display)] text-4xl">
        About Ember &amp; Grain
      </h1>
      <p className="mb-8 max-w-2xl text-[var(--color-text-dim)]">
        We opened with one rule: if it can be cooked over live fire, it
        should be. No shortcuts, no flat-tops — just coals, smoke, and time.
        Every dish on the menu passes through real flame before it reaches
        your table.
      </p>

      <div className="relative mb-10 aspect-[16/7] overflow-hidden rounded-3xl">
        <Image
          src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop"
          alt="Live-fire cooking at Ember & Grain"
          fill
          className="object-cover"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <Flame className="mb-3 h-5 w-5 text-[var(--color-ember)]" />
          <h3 className="mb-1 font-medium">Live fire, always</h3>
          <p className="text-sm text-[var(--color-text-dim)]">
            Smoked, charred, or seared — never microwaved, never reheated.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <Leaf className="mb-3 h-5 w-5 text-[var(--color-ember)]" />
          <h3 className="mb-1 font-medium">Honest ingredients</h3>
          <p className="text-sm text-[var(--color-text-dim)]">
            Local produce where we can get it, clearly labeled dietary tags
            everywhere else.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <Clock className="mb-3 h-5 w-5 text-[var(--color-ember)]" />
          <h3 className="mb-1 font-medium">Open daily</h3>
          <p className="text-sm text-[var(--color-text-dim)]">
            11:00 AM – 10:00 PM, dine-in or delivered to your door.
          </p>
        </div>
      </div>
    </div>
  );
}
