import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:1420/documents", {
    waitUntil: "domcontentloaded",
  });
});

test("shell loads (sidebar + editor)", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Toggle Sidebar" })).toBeVisible();
  await expect(page.getByPlaceholder("Search the docs...")).toBeVisible();
  await expect(page.getByRole("button", { name: "New page" })).toBeVisible();
  const editor = page.locator('[contenteditable="true"][role="textbox"].bn-editor');
  await expect(editor).toBeVisible();
});

test("create a new page and open it", async ({ page }) => {
  await page.getByRole("button", { name: "New page" }).click();
  const newPageLink = page.getByRole("link", { name: "Untitled page" }).last();
  await expect(newPageLink).toBeVisible();
  await expect(page).toHaveURL(/#automerge:/);
});

test("type in editor", async ({ page }) => {
  const editor = page.locator('[contenteditable="true"][role="textbox"].bn-editor');
  await editor.click();
  await page.keyboard.type("Hello Mergepad");

  await expect(editor).toContainText("Hello Mergepad");
});
