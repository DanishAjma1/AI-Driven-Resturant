import { NextResponse } from "next/server";
import { createDiscountRuleSchema, apiSuccess } from "@ember-grain/shared";
import { withErrorHandling } from "@/lib/api-handler";
import { requireRole } from "@/lib/require-user";
import { createDiscountRule, listDiscountRules } from "@/lib/data/discounts";

export const GET = withErrorHandling(async () => {
  await requireRole(["ADMIN"]);
  const rules = await listDiscountRules();
  return NextResponse.json(apiSuccess(rules));
});

export const POST = withErrorHandling(async (request: Request) => {
  await requireRole(["ADMIN"]);
  const body = createDiscountRuleSchema.parse(await request.json());
  const rule = await createDiscountRule(body);
  return NextResponse.json(apiSuccess(rule), { status: 201 });
});
