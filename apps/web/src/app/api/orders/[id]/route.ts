import { NextResponse } from "next/server";
import { apiSuccess } from "@ember-grain/shared";
import { withErrorHandling } from "@/lib/api-handler";
import { getOrderForTracking } from "@/lib/data/orders";

export const GET = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const order = await getOrderForTracking(id);
    return NextResponse.json(apiSuccess(order));
  },
);
