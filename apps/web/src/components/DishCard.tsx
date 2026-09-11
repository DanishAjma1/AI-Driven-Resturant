"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Plus, Pencil } from "lucide-react";
import type { MenuItemDTO } from "@ember-grain/shared";
import { useCart } from "@/components/CartProvider";
import { DishPrice } from "@/components/DishPrice";

export function DishCard({
  item,
  adminMode = false,
}: {
  item: MenuItemDTO;
  /** ADMIN viewing the menu sees an edit shortcut instead of a purchase action. */
  adminMode?: boolean;
}) {
  const { addItem } = useCart();

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <Link href={`/dish/${item.id}`} className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {item.popular && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--color-ember)] px-2.5 py-1 text-xs font-semibold text-[var(--color-bg)]">
            Popular
          </span>
        )}
        {!item.isAvailable && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-900/90 px-2.5 py-1 text-xs font-semibold text-slate-300">
            Unavailable
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/dish/${item.id}`}>
            <h3 className="font-[family-name:var(--font-display)] text-lg leading-tight hover:text-[var(--color-ember)]">
              {item.name}
            </h3>
          </Link>
          <div className="flex shrink-0 items-center gap-1 text-sm text-[var(--color-grain)]">
            <Star className="h-3.5 w-3.5 fill-current" />
            {item.rating.toFixed(1)}
          </div>
        </div>
        <p className="line-clamp-2 text-sm text-[var(--color-text-dim)]">{item.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <DishPrice item={item} />
          {adminMode ? (
            <Link
              href={`/admin/menu?item=${item.id}`}
              className="flex items-center gap-1 rounded-full bg-[var(--color-surface-2)] px-3 py-1.5 text-sm hover:bg-[var(--color-ember)] hover:text-[var(--color-bg)]"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit dish
            </Link>
          ) : (
            <button
              onClick={() => addItem(item)}
              disabled={!item.isAvailable}
              className="flex items-center gap-1 rounded-full bg-[var(--color-surface-2)] px-3 py-1.5 text-sm hover:bg-[var(--color-ember)] hover:text-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
