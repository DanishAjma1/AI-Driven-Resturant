import Image from "next/image";
import { notFound } from "next/navigation";
import { Star, Flame as CaloriesIcon } from "lucide-react";
import { getMenuItemsByIds, listMenuItems } from "@/lib/data/menu";
import { getCurrentUser } from "@/lib/session";
import { DishCustomizer } from "@/components/DishCustomizer";
import { DishPairings } from "@/components/DishPairings";
import { DishPrice } from "@/components/DishPrice";
import { YouMayAlsoLike } from "@/components/YouMayAlsoLike";

export default async function DishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [[item], catalog, user] = await Promise.all([
    getMenuItemsByIds([id]),
    listMenuItems({ onlyAvailable: true }),
    getCurrentUser(),
  ]);

  if (!item) notFound();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm uppercase tracking-wide text-[var(--color-text-faint)]">
                {item.category}
              </p>
              {isAdmin && (
                <a
                  href={`/admin/menu?item=${item.id}`}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs hover:border-[var(--color-ember)]"
                >
                  Edit dish
                </a>
              )}
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl">{item.name}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-[var(--color-grain)]">
                <Star className="h-4 w-4 fill-current" />
                {item.rating.toFixed(1)}
              </div>
              {item.calories !== null && (
                <div className="flex items-center gap-1 text-[var(--color-text-dim)]">
                  <CaloriesIcon className="h-4 w-4" />
                  {item.calories} cal
                </div>
              )}
            </div>

            <p className="mt-4 text-[var(--color-text-dim)]">{item.description}</p>

            {item.ingredients.length > 0 && (
              <p className="mt-3 text-sm text-[var(--color-text-faint)]">
                <span className="font-medium text-[var(--color-text-dim)]">Ingredients: </span>
                {item.ingredients.join(", ")}
              </p>
            )}

            {item.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      tag === "Spicy"
                        ? "border-[var(--color-ember)] text-[var(--color-ember)]"
                        : "border-[var(--color-border)] text-[var(--color-text-dim)]"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6">
              <DishPrice item={item} className="text-2xl" />
            </div>

            <div className="mt-6">
              <DishCustomizer item={item} />
            </div>

            <DishPairings item={item} catalog={catalog} />
          </div>
        </div>
      </div>

      <YouMayAlsoLike item={item} catalog={catalog} />
    </div>
  );
}
