import { NextResponse } from "next/server";
import { apiSuccess } from "@ember-grain/shared";
import { withErrorHandling } from "@/lib/api-handler";
import { SESSION_COOKIE } from "@/lib/auth";

export const POST = withErrorHandling(async () => {
  const res = NextResponse.json(apiSuccess({ loggedOut: true }));
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
});
