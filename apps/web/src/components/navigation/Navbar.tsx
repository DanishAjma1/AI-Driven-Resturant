"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Flame,
  ShoppingBag,
  User,
  ChefHat,
  Truck,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import type { AuthUserDTO, NavRole } from "@ember-grain/shared";
import { useCart } from "@/components/CartProvider";

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/tracking", label: "Track Order" },
];

const ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/menu", label: "Menu Manipulation" },
  { href: "/admin/discounts", label: "Promotions" },
  { href: "/admin/forecasting", label: "Demand Forecast" },
  { href: "/portal/kitchen", label: "Kitchen Portal" },
  { href: "/portal/driver", label: "Driver Portal" },
];

export function Navbar({ user }: { user: AuthUserDTO | null }) {
  const role: NavRole = user?.role ?? "ANONYMOUS";
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isOps = role === "COOK" || role === "DRIVER";
  const isAdmin = role === "ADMIN";

  const navLinks = isOps
    ? [
        { href: "/portal/kitchen", label: "Operations Queue" },
        { href: "/contact", label: "Ops Support & Contact" },
      ]
    : isAdmin
      ? [...PUBLIC_LINKS, ...ADMIN_LINKS.map((link) => ({ ...link }))]
      : PUBLIC_LINKS;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Flame
              className="h-5 w-5 text-[var(--color-ember)]"
              strokeWidth={2.5}
            />
            <span className="font-[family-name:var(--font-display)] text-lg tracking-tight">
              Ember &amp; Grain
            </span>
          </Link>

          {isOps ? (
            <div className="hidden md:block">
              <OpsNav role={role} pathname={pathname} />
            </div>
          ) : (
            <nav className="hidden items-center gap-6 text-sm text-[var(--color-text-dim)] md:flex">
              {PUBLIC_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    pathname === link.href
                      ? "font-medium text-[var(--color-ember)]"
                      : "hover:text-[var(--color-text)]"
                  }
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <div className="flex items-center gap-4 border-l border-[var(--color-border)] pl-6">
                  {ADMIN_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="whitespace-nowrap hover:text-[var(--color-ember)]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </nav>
          )}

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {!isOps && !isMobileMenuOpen && (
              <Link
                href="/cart"
                aria-label="Shopping cart"
                className="relative hidden items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm hover:border-[var(--color-ember)] sm:flex"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-ember)] text-xs font-semibold text-[var(--color-bg)]">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                className="hidden items-center gap-2 rounded-full bg-[var(--color-surface-2)] px-3 py-1.5 text-sm hover:bg-[var(--color-surface)] sm:flex"
              >
                {isAdmin ? (
                  <ShieldCheck className="h-4 w-4 text-[var(--color-ember)]" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {user.name.split(" ")[0]}
                </span>
                <LogOut className="h-3.5 w-3.5 text-[var(--color-text-faint)]" />
              </button>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-full bg-[var(--color-ember)] px-4 py-1.5 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)] sm:inline-flex"
              >
                Sign in
              </Link>
            )}

            <button
              type="button"
              aria-label={
                isMobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] md:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--color-bg)] md:hidden">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="flex items-center gap-2"
              >
                <Flame
                  className="h-5 w-5 text-[var(--color-ember)]"
                  strokeWidth={2.5}
                />
                <span className="font-[family-name:var(--font-display)] text-lg tracking-tight">
                  Ember &amp; Grain
                </span>
              </Link>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={`rounded-2xl border px-4 py-3 text-base font-medium ${
                    pathname === link.href
                      ? "border-[var(--color-ember)] bg-[var(--color-ember)]/10 text-[var(--color-ember)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {!isOps && (
                <Link
                  href="/cart"
                  onClick={closeMobileMenu}
                  className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base font-medium text-[var(--color-text)]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Cart
                </Link>
              )}

              <div className="mt-auto space-y-3 border-t border-[var(--color-border)] pt-6">
                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-surface-2)] px-4 py-3 text-base font-medium text-[var(--color-text)]"
                  >
                    {isAdmin ? (
                      <ShieldCheck className="h-4 w-4 text-[var(--color-ember)]" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    Sign out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="flex w-full items-center justify-center rounded-2xl bg-[var(--color-ember)] px-4 py-3 text-base font-medium text-[var(--color-bg)]"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

/** Minimalist, distraction-free header for kitchen/driver operations. */
function OpsNav({
  role,
  pathname,
}: {
  role: "COOK" | "DRIVER";
  pathname: string;
}) {
  const dashboardHref = role === "COOK" ? "/portal/kitchen" : "/portal/driver";
  const Icon = role === "COOK" ? ChefHat : Truck;
  const iconColor = role === "COOK" ? "text-amber-400" : "text-sky-400";

  return (
    <div className="flex items-center gap-6 text-sm">
      <span className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 font-medium text-[var(--color-text-dim)]">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        {role === "COOK"
          ? "Kitchen Staff: Shift Active"
          : "Delivery Driver: Available"}
      </span>
      <Link
        href={dashboardHref}
        className={
          pathname.startsWith("/portal")
            ? "font-semibold text-[var(--color-ember)]"
            : "text-[var(--color-text-dim)] hover:text-[var(--color-ember)]"
        }
      >
        Operations Queue
      </Link>
      <Link
        href="/contact"
        className={
          pathname === "/contact"
            ? "font-semibold text-[var(--color-ember)]"
            : "text-[var(--color-text-dim)] hover:text-[var(--color-ember)]"
        }
      >
        Ops Support &amp; Contact
      </Link>
    </div>
  );
}
