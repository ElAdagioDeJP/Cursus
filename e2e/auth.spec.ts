import { expect, test } from "@playwright/test";

test("sin sesión redirige a sign-in", async ({ page }) => {
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole("button", { name: /GitHub/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Google/ })).toBeVisible();
});
