import { NextResponse } from "next/server";
import { updateOrderStatusSchema, apiSuccess } from "@ember-grain/shared";
import { withErrorHandling } from "@/lib/api-handler";
import { requireRole } from "@/lib/require-user";
import { updateOrderStatus } from "@/lib/data/orders";

export const PATCH = withErrorHandling(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireRole(["COOK", "ADMIN"]);
    const { id } = await context.params;
    const body = updateOrderStatusSchema.parse(await request.json());

    const order = await updateOrderStatus(id, body.status, {
      id: user.id,
      role: user.role === "ADMIN" ? "ADMIN" : "COOK",
    });
    return NextResponse.json(apiSuccess(order));
  },
);
