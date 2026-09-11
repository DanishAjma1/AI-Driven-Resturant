import { z } from "zod";
import { DiscountType, DiscountScope } from "../types/domain";

const baseDiscountSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Code must be at least 3 characters")
    .max(24)
    .regex(/^[A-Z0-9_-]+$/i, "Use letters, numbers, - or _ only"),
  discountType: z.nativeEnum(DiscountType),
  value: z.number().positive("Value must be greater than 0"),
  scope: z.nativeEnum(DiscountScope),
  category: z.string().trim().min(1).optional(),
  targetItemIds: z.array(z.string().min(1)).optional(),
  isScheduled: z.boolean().default(false),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

export const createDiscountRuleSchema = baseDiscountSchema.superRefine((data, ctx) => {
  if (data.discountType === DiscountType.PERCENTAGE && data.value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["value"],
      message: "A percentage discount can't exceed 100.",
    });
  }
  if (data.scope === DiscountScope.CATEGORY && !data.category) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["category"],
      message: "Category scope requires a category.",
    });
  }
  if (
    data.scope === DiscountScope.SELECTIVE_ITEMS &&
    (!data.targetItemIds || data.targetItemIds.length === 0)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targetItemIds"],
      message: "Selective-item scope requires at least one item.",
    });
  }
  if (data.isScheduled && (!data.startDate || !data.endDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startDate"],
      message: "Scheduled discounts require a start and end date.",
    });
  }
  if (data.isScheduled && data.startDate && data.endDate && data.endDate <= data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "End date must be after the start date.",
    });
  }
});
export type CreateDiscountRuleInput = z.infer<typeof createDiscountRuleSchema>;

export const updateDiscountRuleSchema = baseDiscountSchema.partial();
export type UpdateDiscountRuleInput = z.infer<typeof updateDiscountRuleSchema>;
