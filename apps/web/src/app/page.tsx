import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { listMenuItems } from "@/lib/data/menu";
import { getCurrentUser } from "@/lib/session";
import { AiMenuAssistant } from "@/components/AiMenuAssistant";
import { DishCard } from "@/components/DishCard";

export default async function HomePage() {
  const [user, items] = await Promise.all([
    getCurrentUser(),
    listMenuItems({ onlyAvailable: true }),
  ]);
  const isAdmin = user?.role === "ADMIN";
  const popular = items.filter((i) => i.popular);
  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-14 md:grid-cols-2 md:items-center md:pt-20">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-5xl leading-[1.05] md:text-6xl">
            Cooked over
            <br />
            live fire, plated
            <br />
            with intent.
          </h1>
          <p className="mt-5 max-w-md text-[var(--color-text-dim)]">
            Ember &amp; Grain smokes, chars and sears everything to order.
            Browse the menu, or tell our AI guide what you&apos;re craving
            tonight.
          </p>
          <div className="mt-7">
            <AiMenuAssistant catalog={items} variant="hero" />
          </div>
          <Link
            href="/menu"
            className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--color-grain)] hover:text-[var(--color-ember)]"
          >
            Browse the full menu <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
          <Image
            src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop"
            alt="Smoked short rib plated over ember-roasted roots"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>

      {popular.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="mb-5 font-[family-name:var(--font-display)] text-2xl">
            Guest favorites
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((item) => (
              <DishCard key={item.id} item={item} adminMode={isAdmin} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-5 font-[family-name:var(--font-display)] text-2xl">
          Explore by category
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {categories.map((category) => {
            const sample = items.find((i) => i.category === category)!;
            return (
              <Link
                key={category}
                href={`/menu?category=${encodeURIComponent(category)}`}
                className="group relative aspect-square overflow-hidden rounded-2xl"
              >
                <Image
                  src={sample.imageUrl}
                  alt={category}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute bottom-4 left-4 font-[family-name:var(--font-display)] text-xl text-white">
                  {category}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
