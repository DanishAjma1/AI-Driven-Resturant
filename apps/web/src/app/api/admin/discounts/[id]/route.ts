import { NextResponse } from "next/server";
import { updateDiscountRuleSchema, apiSuccess } from "@ember-grain/shared";
import { withErrorHandling } from "@/lib/api-handler";
import { requireRole } from "@/lib/require-user";
import { deleteDiscountRule, updateDiscountRule } from "@/lib/data/discounts";

export const PATCH = withErrorHandling(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const body = updateDiscountRuleSchema.parse(await request.json());
    const rule = await updateDiscountRule(id, body);
    return NextResponse.json(apiSuccess(rule));
  },
);

export const DELETE = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    await deleteDiscountRule(id);
    return NextResponse.json(apiSuccess({ deleted: true }));
  },
);
