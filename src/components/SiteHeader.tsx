"use client";

import Link from "next/link";
import { Flame, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export function SiteHeader({ onCart }: { onCart: () => void }) {
  const { count, total } = useCart();
  return (
    <header className="glass site-header">
      <div className="shell nav-row">
        <Link href="/" className="brand">
          <Flame color="#ff6b35" fill="#ff6b35" size={22} /> EMBER & GRAIN
        </Link>
        <nav>
          <Link href="/menu">Menu</Link>
          <Link href="/admin">Staff view</Link>
          <button className="outline cart-button" onClick={onCart}>
            <ShoppingBag size={16} />{" "}
            {count ? `${count} · $${total}` : "Your order"}
          </button>
        </nav>
      </div>
    </header>
  );
}
