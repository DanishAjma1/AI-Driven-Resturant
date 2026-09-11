import { listDiscountRules } from "@/lib/data/discounts";
import { listMenuItems } from "@/lib/data/menu";
import { DiscountManager } from "@/components/admin/DiscountManager";

export default async function AdminDiscountsPage() {
  const [rules, items] = await Promise.all([
    listDiscountRules(),
    listMenuItems({ onlyAvailable: false }),
  ]);
  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl">Promotions &amp; discounts</h1>
      <p className="mb-8 text-[var(--color-text-dim)]">
        Rule-based discounts applied automatically at checkout — global, by
        category, or targeting specific dishes.
      </p>
      <DiscountManager initialRules={rules} categories={categories} items={items} />
    </div>
  );
}
