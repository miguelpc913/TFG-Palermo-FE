import { expect, Page } from "@playwright/test";

const APP_URL = "http://localhost:4173";
const editorLocatorString = `[contenteditable="true"][role="textbox"].bn-editor`;

async function waitForAppReady(page: Page) {
  await page.goto(`${APP_URL}/documents`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(editorLocatorString)).toBeVisible();
  await expect(page.getByPlaceholder("Search the docs...")).toBeVisible();
  const skeletons = await page.getByTestId("sidebar-skeleton-menu-item").all();
  for (const skeleton of skeletons) {
    await skeleton.waitFor({ state: "detached" });
  }
}

function editor(page: Page) {
  return page.locator(editorLocatorString);
}

export { editor, waitForAppReady, APP_URL };
