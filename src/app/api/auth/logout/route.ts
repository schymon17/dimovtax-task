import { NextResponse } from "next/server";

import { sessionCookieName } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    maxAge: 0,
    name: sessionCookieName,
    path: "/",
    value: "",
  });

  return response;
}
