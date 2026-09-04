"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { menuItems } from "@/data/menu";
import { AiMenuSearch } from "@/components/AiMenuSearch";
import { CartDrawer } from "@/components/CartDrawer";
import { SiteHeader } from "@/components/SiteHeader";
import { useCart } from "@/components/CartProvider";

export default function LandingPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const { count } = useCart();
  return (
    <main>
      <SiteHeader onCart={() => setCartOpen(true)} />
      <section className="hero">
        <div className="shell hero-grid">
          <div>
            <div className="eyebrow">CHARCOAL KITCHEN · NOW DELIVERING</div>
            <h1 className="serif hero-title">
              Fire, served
              <br />
              <i>thoughtfully.</i>
            </h1>
            <p className="hero-copy">
              Seasonal plates, open flame, and a little theatre. Explore the
              menu and let us bring the ember home.
            </p>
            <Link href="/menu" className="orange button-link">
              Explore the menu <ArrowRight size={16} />
            </Link>
          </div>
          <div className="hero-image">
            <Image
              src={menuItems[0].image}
              alt="Smoked short rib"
              fill
              priority
              sizes="(max-width: 800px) 100vw, 45vw"
              style={{ objectFit: "cover" }}
            />
            <div className="image-caption">
              <span className="tag">CHEF'S CHOICE</span>
              <div className="serif">Smoked Short Rib</div>
            </div>
          </div>
        </div>
      </section>
      <section className="shell landing-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">FROM THE FIRE</div>
            <h2 className="serif">A menu with a little heat.</h2>
          </div>
          <Link href="/menu" className="text-link">
            View full menu <ArrowRight size={15} />
          </Link>
        </div>
        <div className="category-grid">
          {["Mains", "Starters", "Desserts"].map((category) => {
            const item = menuItems.find((x) => x.category === category);
            return (
              <Link
                href={`/menu?category=${category.toLowerCase()}`}
                className="category-card"
                key={category}
              >
                {item && (
                  <Image
                    src={item.image}
                    alt={category}
                    fill
                    sizes="33vw"
                    style={{ objectFit: "cover" }}
                  />
                )}
                <span>{category}</span>
              </Link>
            );
          })}
        </div>
        <AiMenuSearch />
        <div className="cta-card">
          <div>
            <div className="eyebrow">READY WHEN YOU ARE</div>
            <h2 className="serif">Make tonight delicious.</h2>
          </div>
          <Link href="/menu" className="orange button-link">
            Start an order <ShoppingBag size={16} />
          </Link>
        </div>
      </section>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </main>
  );
}
