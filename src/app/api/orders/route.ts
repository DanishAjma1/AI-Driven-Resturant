import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder, listOrders } from "@/lib/orders";

const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string(),
  image: z.string(),
  tags: z.array(
    z.enum(["Vegan", "Vegetarian", "Gluten-Free", "Halal", "Nut-Free"]),
  ),
  rating: z.number(),
  quantity: z.number().int().positive(),
});

export async function GET() {
  return NextResponse.json({ orders: listOrders() });
}

export async function POST(request: Request) {
  try {
    const body = z
      .object({ items: z.array(itemSchema), customer: z.string().optional() })
      .parse(await request.json());
    return NextResponse.json(createOrder(body.items, body.customer));
  } catch {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }
}
