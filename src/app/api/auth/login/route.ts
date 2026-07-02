import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createSessionToken,
  getDemoUser,
  sessionCookieName,
  validateCredentials,
} from "@/lib/auth";

export const runtime = "nodejs";

const loginSchema = z.object({
  password: z.string().min(1),
  username: z.string().email(),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());

  if (
    !parsed.success ||
    !(await validateCredentials(parsed.data.username, parsed.data.password))
  ) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ user: { name: getDemoUser().name } });

  response.cookies.set({
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    name: sessionCookieName,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    value: createSessionToken(),
  });

  return response;
}
