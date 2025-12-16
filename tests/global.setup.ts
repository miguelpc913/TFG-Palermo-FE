import { chromium, expect, FullConfig } from "@playwright/test";
import { APP_URL } from "./utils";

const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

export default async function globalSetup(_: FullConfig) {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error("Missing prod test credentials");
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${APP_URL}/`, { waitUntil: "domcontentloaded" });
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error("Missing prod test credentials");
  }
  await page.getByRole("link", { name: "Log in" }).click();
  await expect(page).toHaveURL(`${APP_URL}/login`);

  // Prefer getByLabel if you can. If not, keep your role selectors.
  await page.getByRole("textbox", { name: "email" }).fill(TEST_EMAIL);
  await page.getByRole("textbox", { name: "password" }).fill(TEST_PASSWORD);

  // Clicking + waiting for navigation in a SPA: wait for URL change
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/documents/);
  await page.context().storageState({
    path: "playwright/.auth/user.json",
  });
  await browser.close();
}
