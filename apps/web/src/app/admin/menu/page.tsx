import { listAllMenuItemsForAdmin } from "@/lib/data/menu-admin";
import { MenuManager } from "@/components/admin/MenuManager";

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const { item } = await searchParams;
  const items = await listAllMenuItemsForAdmin();

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl">
        Menu manipulation
      </h1>
      <p className="mb-8 text-[var(--color-text-dim)]">
        Create dishes, adjust pricing, and toggle availability.
      </p>
      <MenuManager initialItems={items} focusItemId={item} />
    </div>
  );
}
