import { NextResponse } from "next/server";
import { createOrderSchema, apiSuccess } from "@ember-grain/shared";
import { withErrorHandling } from "@/lib/api-handler";
import { requireUser } from "@/lib/require-user";
import { createOrder, listOrdersForCustomer } from "@/lib/data/orders";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const orders = await listOrdersForCustomer(user.id);
  return NextResponse.json(apiSuccess(orders));
});

export const POST = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const body = createOrderSchema.parse(await request.json());
  const order = await createOrder(user.id, body.items, body.fulfillment);
  return NextResponse.json(apiSuccess(order), { status: 201 });
});
