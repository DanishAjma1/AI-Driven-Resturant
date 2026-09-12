import { prisma } from "@ember-grain/db";
import type { MenuItemInput, UpdateMenuItemInput, MenuItemDTO } from "@ember-grain/shared";
import { NotFoundError, ValidationError } from "@/lib/api-handler";
import { withDatabaseFallback } from "@/lib/db-fallback";

type PrismaMenuItem = Awaited<ReturnType<typeof prisma.menuItem.findMany>>[number];

/** Admin views never need the computed customer-facing discount, so it's always null here. */
function toAdminDTO(item: PrismaMenuItem): MenuItemDTO {
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
    discount: null,
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "dish";
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await prisma.menuItem.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

/** Every item including unavailable ones — for the admin manipulation table. */
export async function listAllMenuItemsForAdmin(): Promise<MenuItemDTO[]> {
  return withDatabaseFallback(
    async () => {
      const items = await prisma.menuItem.findMany({
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      return items.map(toAdminDTO);
    },
    [],
    "listAllMenuItemsForAdmin",
  );
}

export async function createMenuItem(input: MenuItemInput): Promise<MenuItemDTO> {
  const slug = await uniqueSlug(input.name);
  const created = await prisma.menuItem.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      price: input.price,
      category: input.category,
      imageUrl: input.imageUrl,
      isAvailable: input.isAvailable,
      tags: input.tags,
      popular: input.popular,
      calories: input.calories ?? null,
      ingredients: input.ingredients,
    },
  });
  return toAdminDTO(created);
}

export async function updateMenuItem(
  id: string,
  input: UpdateMenuItemInput,
): Promise<MenuItemDTO> {
  const existing = await prisma.menuItem.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Menu item not found.");

  const updated = await prisma.menuItem.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      price: input.price,
      category: input.category,
      imageUrl: input.imageUrl,
      isAvailable: input.isAvailable,
      tags: input.tags,
      popular: input.popular,
      calories: input.calories,
      ingredients: input.ingredients,
    },
  });

  return toAdminDTO(updated);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const existing = await prisma.menuItem.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Menu item not found.");

  const inUse = await prisma.orderItem.findFirst({ where: { menuItemId: id } });
  if (inUse) {
    throw new ValidationError(
      "This item has order history and can't be deleted — mark it unavailable instead.",
    );
  }

  await prisma.menuItem.delete({ where: { id } });
}
