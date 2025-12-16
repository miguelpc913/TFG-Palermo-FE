import { test, expect } from "./test.setup.delay";
import { waitForAppReady, editor } from "./utils";

test("Persistence across reload: page + content + sidebar title persist", async ({ page }) => {
  await waitForAppReady(page);

  await page.getByRole("button", { name: "New page" }).click();

  const pageLink = page.getByRole("link", { name: "Untitled page" }).last();
  await expect(pageLink).toBeVisible();

  const e = editor(page);
  await e.click();

  const text = `Hello Mergepad ${Date.now()}`;
  await page.keyboard.type(text);

  // Sidebar title derived from content (your app already does this)
  await expect(page.getByRole("link", { name: text })).toBeVisible();

  // Reload and verify it’s still there
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("sidebar-skeleton-menu-item")).toHaveCount(0);

  await expect(editor(page)).toContainText(text);
  await expect(page.getByRole("link", { name: text })).toBeVisible();
});
