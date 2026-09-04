import { NextResponse } from "next/server";
import { advanceOrder, getOrder } from "@/lib/orders";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const { id } = await context.params;
  const order = getOrder(id);
  return order
    ? NextResponse.json(order)
    : NextResponse.json({ error: "Order not found" }, { status: 404 });
}

export async function PATCH(_: Request, context: Context) {
  const { id } = await context.params;
  const order = advanceOrder(id);
  return order
    ? NextResponse.json(order)
    : NextResponse.json({ error: "Order not found" }, { status: 404 });
}
