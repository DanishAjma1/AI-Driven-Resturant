"use client";
import Link from "next/link";
import { Flame, Instagram, Facebook, Twitter, ChefHat, Truck } from "lucide-react";
import type { NavRole } from "@ember-grain/shared";

const BUILD_TIMESTAMP = process.env.NEXT_PUBLIC_BUILD_TIME ?? new Date().toISOString();

export function Footer({ role }: { role: NavRole }) {
  const isOps = role === "COOK" || role === "DRIVER";
  return isOps ? <OpsFooter role={role} /> : <PublicFooter role={role} />;
}

function PublicFooter({ role }: { role: NavRole }) {
  return (
    <footer className="border-t border border-border bg--surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-[var(--color-ember)]" strokeWidth={2.5} />
            <span className="font-[family-name:var(--font-display)] text-lg">Ember &amp; Grain</span>
          </div>
          <p className="mb-4 text-sm text-[var(--color-text-dim)]">
            Live-fire cooking, honest ingredients. Every plate touches real
            coals before it touches your table.
          </p>
          <p className="mb-4 text-sm text-[var(--color-text-faint)]">
            Open daily · 11:00 AM – 10:00 PM
          </p>
          <div className="flex gap-3 text-[var(--color-text-faint)]">
            <Instagram className="h-4 w-4 hover:text-[var(--color-ember)]" />
            <Facebook className="h-4 w-4 hover:text-[var(--color-ember)]" />
            <Twitter className="h-4 w-4 hover:text-[var(--color-ember)]" />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-[var(--color-text)]">Quick links</h3>
          <ul className="space-y-2 text-sm text-[var(--color-text-dim)]">
            <li><Link href="/" className="hover:text-[var(--color-ember)]">Home</Link></li>
            <li><Link href="/menu" className="hover:text-[var(--color-ember)]">Full menu</Link></li>
            <li><Link href="/menu" className="hover:text-[var(--color-ember)]">Special offers</Link></li>
            <li><Link href="/about" className="hover:text-[var(--color-ember)]">About us</Link></li>
            <li><Link href="/contact" className="hover:text-[var(--color-ember)]">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-[var(--color-text)]">Legal &amp; safety</h3>
          <ul className="space-y-2 text-sm text-[var(--color-text-dim)]">
            <li><Link href="/privacy" className="hover:text-[var(--color-ember)]">Privacy policy</Link></li>
            <li><Link href="/terms" className="hover:text-[var(--color-ember)]">Terms of service</Link></li>
            <li><Link href="/dietary-safety" className="hover:text-[var(--color-ember)]">Dietary &amp; food safety</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-[var(--color-text)]">Get in touch</h3>
          <ul className="mb-4 space-y-2 text-sm text-[var(--color-text-dim)]">
            <li>+1 (555) 240-8817</li>
            <li>hello@embergrain.dev</li>
            <li>418 Ashwood Lane, Portland, OR</li>
          </ul>
          {role? "": (
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex overflow-hidden rounded-full border border-[var(--color-border)]"
          >
            <input
              type="email"
              placeholder="Email for offers"
              className="w-full bg-transparent px-3 py-2 text-xs outline-none"
            />
            <button
              type="submit"
              className="bg-[var(--color-ember)] text-nowrap px-3 py-2 text-xs font-medium text-[var(--color-bg)]"
            >
              Sign up
            </button>
          </form>
          )}
        </div>
      </div>
      <div className="border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-faint)]">
        © {new Date().getFullYear()} Ember &amp; Grain. All rights reserved.
      </div>
    </footer>
  );
}

function OpsFooter({ role }: { role: "COOK" | "DRIVER" }) {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-8 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-dim)]">
          {role === "COOK" ? (
            <ChefHat className="h-4 w-4 text-amber-400" />
          ) : (
            <Truck className="h-4 w-4 text-sky-400" />
          )}
          Shift status: <span className="font-medium text-[var(--color-text)]">Active</span>
        </div>

        <div className="flex flex-col justify-center gap-2 text-sm sm:flex-row sm:gap-8">
          <div>
            <p className="font-medium text-[var(--color-text)]">Kitchen ops emergency</p>
            <p className="text-[var(--color-text-dim)]">
              +1 (800) KITCHEN-HELP · kitchen-support@embergrain.dev
            </p>
          </div>
          <div>
            <p className="font-medium text-[var(--color-text)]">Driver logistics help</p>
            <p className="text-[var(--color-text-dim)]">
              +1 (800) DRIVER-DISPATCH · dispatch@embergrain.dev
            </p>
          </div>
        </div>

        <p className="text-xs text-[var(--color-text-faint)]">Build {BUILD_TIMESTAMP}</p>
      </div>
    </footer>
  );
}
