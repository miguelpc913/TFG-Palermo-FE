import { test, expect } from "@playwright/test";

test("auth: login and save storage state", async ({ page }) => {
  await page.goto("http://localhost:1420/", { waitUntil: "domcontentloaded" });

  await page.getByRole("link", { name: "Log in" }).click();
  await expect(page).toHaveURL("http://localhost:1420/login");

  // Prefer getByLabel if you can. If not, keep your role selectors.
  await page.getByRole("textbox", { name: "email" }).fill("2e2account@mergepad.com");
  await page.getByRole("textbox", { name: "password" }).fill("test");

  // Clicking + waiting for navigation in a SPA: wait for URL change
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/documents/);

  // Save cookies/localStorage/etc for other tests
  await page.context().storageState({ path: "playwright/.auth/user.json" });
});
