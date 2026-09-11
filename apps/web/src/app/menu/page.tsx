import { listMenuItems } from "@/lib/data/menu";
import { getCurrentUser } from "@/lib/session";
import { MenuCatalog } from "@/components/MenuCatalog";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [user, items] = await Promise.all([
    getCurrentUser(),
    listMenuItems({ onlyAvailable: false }),
  ]);
  const isAdmin = user?.role === "ADMIN";
  const visibleItems = isAdmin ? items : items.filter((i) => i.isAvailable);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-4xl">
        The full menu
      </h1>
      <p className="mb-10 max-w-xl text-[var(--color-text-dim)]">
        {isAdmin
          ? "Admin view — includes unavailable items. Click a dish to edit it."
          : "Everything is fired over live coals. Filter by diet or search for what sounds good tonight."}
      </p>
      <MenuCatalog items={visibleItems} initialCategory={category} adminMode={isAdmin} />
    </div>
  );
}
