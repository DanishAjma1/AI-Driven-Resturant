import { NextResponse } from "next/server";
import { apiSuccess } from "@ember-grain/shared";
import { withErrorHandling } from "@/lib/api-handler";
import { requireRole } from "@/lib/require-user";
import { listKitchenQueue } from "@/lib/data/orders";

export const GET = withErrorHandling(async () => {
  await requireRole(["COOK", "ADMIN"]);
  const orders = await listKitchenQueue();
  return NextResponse.json(apiSuccess(orders));
});
