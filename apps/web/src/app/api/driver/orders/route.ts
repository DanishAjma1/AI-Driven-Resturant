import { NextResponse } from "next/server";
import { apiSuccess } from "@ember-grain/shared";
import { withErrorHandling } from "@/lib/api-handler";
import { requireRole } from "@/lib/require-user";
import { listDriverBoard } from "@/lib/data/orders";

export const GET = withErrorHandling(async () => {
  await requireRole(["DRIVER", "ADMIN"]);
  const orders = await listDriverBoard();
  return NextResponse.json(apiSuccess(orders));
});
