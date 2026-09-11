import type { MenuItemDTO } from "@ember-grain/shared";
import { DishCard } from "@/components/DishCard";

export function YouMayAlsoLike({
  item,
  catalog,
}: {
  item: MenuItemDTO;
  catalog: MenuItemDTO[];
}) {
  const suggestions = catalog
    .filter((c) => c.id !== item.id && c.category === item.category)
    .slice(0, 4);

  if (suggestions.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 pb-16">
      <h2 className="mb-5 font-[family-name:var(--font-display)] text-2xl">
        You may also like
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {suggestions.map((dish) => (
          <DishCard key={dish.id} item={dish} />
        ))}
      </div>
    </section>
  );
}
