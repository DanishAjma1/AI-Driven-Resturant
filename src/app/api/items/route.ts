import { menuItems } from "@/data/menu";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ menuItems });
}