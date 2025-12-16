import { test, expect } from "./test.setup.delay";
import { APP_URL, waitForAppReady, editor } from "./utils";

test.beforeEach(async ({ page }) => {
  await waitForAppReady(page);
});

test("Shell loads (sidebar + editor)", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Toggle Sidebar" })).toBeVisible();
  await expect(page.getByPlaceholder("Search the docs...")).toBeVisible();
  await expect(page.getByRole("button", { name: "New page" })).toBeVisible();

  await expect(editor(page)).toBeVisible();
});

test("Search for docs", async ({ page }) => {
  const search = page.getByPlaceholder("Search the docs...");

  await search.fill("For search");

  await expect(page.getByRole("link", { name: "For search" })).toHaveCount(2);
});

test("Create a new page and open it", async ({ page }) => {
  await page.getByRole("button", { name: "New page" }).click();

  const newPageLink = page.getByRole("link", { name: "Untitled page" }).last();
  await expect(newPageLink).toBeVisible();

  const newPageUrl = await newPageLink.getAttribute("href");
  expect(newPageUrl).toBeTruthy();

  // Actually open it (otherwise URL might not change)
  await newPageLink.click();
  await expect(page).toHaveURL(`${APP_URL}/documents${newPageUrl}`);

  const ed = editor(page);
  await ed.click();
  const mergepadString = `Hello Mergepad ${Date.now()}`;
  await page.keyboard.type(mergepadString);
  await expect(ed).toContainText(mergepadString);
  await expect(page.getByRole("link", { name: mergepadString })).toBeVisible();

  // Create child via slash command
  await page.keyboard.press("Enter");
  await page.keyboard.type("/create");
  await page.keyboard.press("Enter");
  await expect(ed).not.toContainText(mergepadString);

  const newChildLink = page.getByRole("link", { name: "Untitled page" }).last();
  await expect(newChildLink).toBeVisible();

  const newChildPageUrl = await newChildLink.getAttribute("href");
  expect(newChildPageUrl).toBeTruthy();

  // Open child to assert navigation
  await newChildLink.click();
  await expect(page).toHaveURL(`${APP_URL}/documents${newChildPageUrl}`);

  // Go back to parent via title
  await page.getByRole("link", { name: mergepadString }).last().click();
  await expect(ed).toContainText(mergepadString);
  await expect(ed).toContainText("Untitled page");

  // Delete a few chars then ensure child link disappears
  await ed.click();
  await ed.focus();
  await ed.press("End");
  await ed.press("Delete");
  await ed.press("Delete");
  await ed.press("Delete");
  await ed.press("Delete");
  await expect(ed).not.toContainText("Untitled page");
  await page.locator(`[href="${newChildPageUrl}"]`).waitFor({ state: "detached" });
});
