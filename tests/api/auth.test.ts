import { describe, expect, it } from "vitest";

import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { sessionCookieName } from "@/lib/auth";

describe("auth API routes", () => {
  it("sets a session cookie for valid demo credentials", async () => {
    const response = await login(
      new Request("http://localhost/api/auth/login", {
        body: JSON.stringify({
          password: "demo-password",
          username: "admin@dimovtax.local",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(sessionCookieName);
  });

  it("rejects invalid credentials", async () => {
    const response = await login(
      new Request("http://localhost/api/auth/login", {
        body: JSON.stringify({
          password: "wrong-password",
          username: "admin@dimovtax.local",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
  });

  it("clears the session cookie on logout", async () => {
    const response = await logout();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
