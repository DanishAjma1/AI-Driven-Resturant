"use client";

import { useState } from "react";
import { CartDrawer } from "@/components/CartDrawer";
import { MenuCatalog } from "@/components/MenuCatalog";
import { SiteHeader } from "@/components/SiteHeader";
import { AiMenuSearch } from "@/components/AiMenuSearch";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MenuContent() {
  // extracting the category from the URL query parameters
  const category = useSearchParams().get("category");
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <main>
      <SiteHeader onCart={() => setCartOpen(true)} />
      <section className="shell menu-page">
        <div className="eyebrow">THE MENU</div>
        <h1 className="serif page-title">Find your next favourite.</h1>
        <p className="muted lead">Every plate starts over the fire.</p>
        <AiMenuSearch />
        <MenuCatalog cate={category} />
      </section>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </main>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<main className="center-page">Loading menu…</main>}>
      <MenuContent />
    </Suspense>
  );
}
