import { prisma } from "@ember-grain/db";
import type { MenuItemDTO } from "@ember-grain/shared";
import { applyDiscounts, listLiveDiscountRules } from "@/lib/data/discounts";
import { withDatabaseFallback } from "@/lib/db-fallback";

type PrismaMenuItem = Awaited<
  ReturnType<typeof prisma.menuItem.findMany>
>[number];

function baseDTO(item: PrismaMenuItem): Omit<MenuItemDTO, "discount"> {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    price: Number(item.price),
    category: item.category,
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
    tags: item.tags as MenuItemDTO["tags"],
    rating: Number(item.rating),
    popular: item.popular,
    calories: item.calories,
    ingredients: item.ingredients,
  };
}

/** Attaches the best-applicable live discount to each item, if any. */
async function withDiscounts(items: PrismaMenuItem[]): Promise<MenuItemDTO[]> {
  const base = items.map(baseDTO);
  const liveRules = await listLiveDiscountRules();
  const discountByItemId = applyDiscounts(base, liveRules);
  return base.map((item) => ({
    ...item,
    discount: discountByItemId.get(item.id) ?? null,
  }));
}

export async function listMenuItems(options?: {
  onlyAvailable?: boolean;
}): Promise<MenuItemDTO[]> {
  return withDatabaseFallback(
    async () => {
      const items = await prisma.menuItem.findMany({
        where: options?.onlyAvailable ? { isAvailable: true } : undefined,
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      return withDiscounts(items);
    },
    [],
    "listMenuItems",
  );
}

export async function getMenuItemBySlug(
  slug: string,
): Promise<MenuItemDTO | null> {
  return withDatabaseFallback(
    async () => {
      const item = await prisma.menuItem.findUnique({ where: { slug } });
      if (!item) return null;
      const [dto] = await withDiscounts([item]);
      return dto ?? null;
    },
    null,
    "getMenuItemBySlug",
  );
}

export async function getMenuItemsByIds(ids: string[]): Promise<MenuItemDTO[]> {
  if (ids.length === 0) return [];

  return withDatabaseFallback(
    async () => {
      const items = await prisma.menuItem.findMany({
        where: { id: { in: ids } },
      });
      return withDiscounts(items);
    },
    [],
    "getMenuItemsByIds",
  );
}
