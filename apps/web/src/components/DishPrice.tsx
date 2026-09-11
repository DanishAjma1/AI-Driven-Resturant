import type { MenuItemDTO } from "@ember-grain/shared";

export function DishPrice({
  item,
  className = "font-[family-name:var(--font-mono)] text-base",
}: {
  item: Pick<MenuItemDTO, "price" | "discount">;
  className?: string;
}) {
  if (!item.discount) {
    return <span className={className}>${item.price.toFixed(2)}</span>;
  }

  return (
    <span className="flex items-center gap-2">
      <span className="font-[family-name:var(--font-mono)] text-[var(--color-text-faint)] line-through">
        ${item.discount.originalPrice.toFixed(2)}
      </span>
      <span className={`${className} text-[var(--color-ember)]`}>
        ${item.discount.finalPrice.toFixed(2)}
      </span>
      <span className="rounded-full bg-[var(--color-ember)]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ember)]">
        {item.discount.label}
      </span>
    </span>
  );
}
