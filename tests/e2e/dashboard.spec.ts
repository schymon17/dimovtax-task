import { expect, test } from "@playwright/test";

test("signs in and filters projects", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByLabel("Email").fill("admin@dimovtax.local");
  await page.getByLabel("Password").fill("demo-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Project operations" })).toBeVisible();
  await expect(page.getByText("Signed in as Demo User")).toBeVisible();

  await page.getByRole("button", { name: "active" }).click();
  await expect(page.getByRole("cell", { name: "Tax Advisory Portal" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Expense Audit Workspace" })).not.toBeVisible();

  await page.getByPlaceholder("Search by project or team member").fill("Revenue");
  await expect(page.getByRole("cell", { name: "Revenue Forecast Dashboard" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Tax Advisory Portal" })).not.toBeVisible();
});
