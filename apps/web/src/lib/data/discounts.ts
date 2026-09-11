import { prisma, Prisma } from "@ember-grain/db";
import {
  DiscountScope,
  DiscountType,
  type ActiveDiscountDTO,
  type DiscountRuleDTO,
  type MenuItemDTO,
} from "@ember-grain/shared";
import { NotFoundError, ValidationError } from "@/lib/api-handler";
import type { CreateDiscountRuleInput, UpdateDiscountRuleInput } from "@ember-grain/shared";

type PrismaDiscountRule = Awaited<ReturnType<typeof prisma.discountRule.findMany>>[number];

function toDTO(rule: PrismaDiscountRule): DiscountRuleDTO {
  return {
    id: rule.id,
    code: rule.code,
    discountType: rule.discountType,
    value: Number(rule.value),
    scope: rule.scope,
    category: rule.category,
    targetItemIds: rule.targetItemIds,
    isScheduled: rule.isScheduled,
    startDate: rule.startDate ? rule.startDate.toISOString() : null,
    endDate: rule.endDate ? rule.endDate.toISOString() : null,
    isActive: rule.isActive,
    createdAt: rule.createdAt.toISOString(),
  };
}

export async function listDiscountRules(): Promise<DiscountRuleDTO[]> {
  const rules = await prisma.discountRule.findMany({ orderBy: { createdAt: "desc" } });
  return rules.map(toDTO);
}

/** Rules currently "live": isActive, and within the schedule window if isScheduled. */
export async function listLiveDiscountRules(): Promise<DiscountRuleDTO[]> {
  const now = new Date();
  const rules = await prisma.discountRule.findMany({
    where: {
      isActive: true,
      OR: [
        { isScheduled: false },
        { isScheduled: true, startDate: { lte: now }, endDate: { gte: now } },
      ],
    },
  });
  return rules.map(toDTO);
}

export async function createDiscountRule(
  input: CreateDiscountRuleInput,
): Promise<DiscountRuleDTO> {
  const existing = await prisma.discountRule.findUnique({ where: { code: input.code } });
  if (existing) throw new ValidationError(`A discount with code "${input.code}" already exists.`);

  const created = await prisma.discountRule.create({
    data: {
      code: input.code.toUpperCase(),
      discountType: input.discountType,
      value: input.value,
      scope: input.scope,
      category: input.category ?? null,
      targetItemIds: input.targetItemIds ?? [],
      isScheduled: input.isScheduled,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      isActive: input.isActive,
    },
  });
  return toDTO(created);
}

export async function updateDiscountRule(
  id: string,
  input: UpdateDiscountRuleInput,
): Promise<DiscountRuleDTO> {
  const existing = await prisma.discountRule.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Discount rule not found.");

  const data: Prisma.DiscountRuleUpdateInput = {};
  if (input.discountType !== undefined) data.discountType = input.discountType;
  if (input.value !== undefined) data.value = input.value;
  if (input.scope !== undefined) data.scope = input.scope;
  if (input.category !== undefined) data.category = input.category;
  if (input.targetItemIds !== undefined) data.targetItemIds = input.targetItemIds;
  if (input.isScheduled !== undefined) data.isScheduled = input.isScheduled;
  if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
  if (input.endDate !== undefined) data.endDate = new Date(input.endDate);
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const updated = await prisma.discountRule.update({ where: { id }, data });
  return toDTO(updated);
}

export async function deleteDiscountRule(id: string): Promise<void> {
  const existing = await prisma.discountRule.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Discount rule not found.");
  await prisma.discountRule.delete({ where: { id } });
}

/** Applies the best-applicable live rule to each item's price (largest savings wins). */
export function applyDiscounts<
  T extends Pick<MenuItemDTO, "id" | "category" | "price">,
>(items: T[], liveRules: DiscountRuleDTO[]): Map<string, ActiveDiscountDTO> {
  const result = new Map<string, ActiveDiscountDTO>();

  for (const item of items) {
    const applicable = liveRules.filter((rule) => {
      if (rule.scope === DiscountScope.GLOBAL) return true;
      if (rule.scope === DiscountScope.CATEGORY) return rule.category === item.category;
      if (rule.scope === DiscountScope.SELECTIVE_ITEMS) {
        return rule.targetItemIds.includes(item.id);
      }
      return false;
    });

    if (applicable.length === 0) continue;

    let best: { rule: DiscountRuleDTO; finalPrice: number } | null = null;
    for (const rule of applicable) {
      const finalPrice =
        rule.discountType === DiscountType.PERCENTAGE
          ? item.price * (1 - rule.value / 100)
          : Math.max(0, item.price - rule.value);
      if (!best || finalPrice < best.finalPrice) {
        best = { rule, finalPrice };
      }
    }

    if (best && best.finalPrice < item.price) {
      const label =
        best.rule.discountType === DiscountType.PERCENTAGE
          ? `${best.rule.value}% OFF`
          : `$${best.rule.value.toFixed(2)} OFF`;
      result.set(item.id, {
        ruleId: best.rule.id,
        code: best.rule.code,
        label,
        originalPrice: item.price,
        finalPrice: Number(best.finalPrice.toFixed(2)),
      });
    }
  }

  return result;
}
