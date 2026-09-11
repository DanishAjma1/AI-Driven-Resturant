import { NextResponse } from "next/server";
import { menuItemInputSchema, apiSuccess } from "@ember-grain/shared";
import { withErrorHandling } from "@/lib/api-handler";
import { requireRole } from "@/lib/require-user";
import { createMenuItem, listAllMenuItemsForAdmin } from "@/lib/data/menu-admin";

export const GET = withErrorHandling(async () => {
  await requireRole(["ADMIN"]);
  const items = await listAllMenuItemsForAdmin();
  return NextResponse.json(apiSuccess(items));
});

export const POST = withErrorHandling(async (request: Request) => {
  await requireRole(["ADMIN"]);
  const body = menuItemInputSchema.parse(await request.json());
  const item = await createMenuItem(body);
  return NextResponse.json(apiSuccess(item), { status: 201 });
});
