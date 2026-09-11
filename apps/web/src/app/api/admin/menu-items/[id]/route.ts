import { NextResponse } from "next/server";
import { updateMenuItemSchema, apiSuccess } from "@ember-grain/shared";
import { withErrorHandling } from "@/lib/api-handler";
import { requireRole } from "@/lib/require-user";
import { deleteMenuItem, updateMenuItem } from "@/lib/data/menu-admin";

export const PATCH = withErrorHandling(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const body = updateMenuItemSchema.parse(await request.json());
    const item = await updateMenuItem(id, body);
    return NextResponse.json(apiSuccess(item));
  },
);

export const DELETE = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    await deleteMenuItem(id);
    return NextResponse.json(apiSuccess({ deleted: true }));
  },
);
