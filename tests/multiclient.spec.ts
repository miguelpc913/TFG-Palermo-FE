import test, { expect } from "@playwright/test";
import { waitForAppReady, editor } from "./utils";

test("Multi-client sync: page B receives updates from page A", async ({ browser }) => {
  // Context A
  const contextA = await browser.newContext({
    // If you rely on storageState in config, you can omit this.
    // Otherwise set the same storageState used by your suite:
    storageState: "playwright/.auth/user.json",
  });
  const pageA = await contextA.newPage();
  await waitForAppReady(pageA);

  // Context B (separate client)
  const contextB = await browser.newContext({
    storageState: "playwright/.auth/user.json",
  });
  const pageB = await contextB.newPage();
  await waitForAppReady(pageB);

  // A creates and types
  await pageA.getByRole("button", { name: "New page" }).click();
  const pageLinkA = await pageA.getByRole("link", { name: "Untitled page" }).last();
  await pageLinkA.click({ noWaitAfter: true });

  const text = `Synced title ${Date.now()}`;
  await editor(pageA).click();
  await pageA.keyboard.type(text);

  // A sees it locally
  await expect(pageA.getByRole("link", { name: text })).toBeVisible();

  // B should eventually see the sidebar update
  const linkOnB = pageB.getByRole("link", { name: text });
  await expect(linkOnB).toBeVisible();

  // B opens it and sees content
  await linkOnB.click();
  await expect(editor(pageB)).toContainText(text);

  await contextA.close();
  await contextB.close();
});

test("Multi-client offline -> resync updates the other client", async ({ browser }) => {
  // Two separate clients (separate contexts)
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await waitForAppReady(pageA);
  await waitForAppReady(pageB);

  // A creates a new page while online so both clients have a shared baseline
  await pageA.getByRole("button", { name: "New page" }).click();
  const newPageLinkA = pageA.getByRole("link", { name: "Untitled page" }).last();
  await expect(newPageLinkA).toBeVisible();

  const href = await newPageLinkA.getAttribute("href");
  expect(href).toBeTruthy();

  // B should eventually see that new page in the sidebar and open it
  const newPageLinkB = pageB.locator(`a[href="${href}"]`);
  await expect(newPageLinkB).toBeVisible();
  await newPageLinkB.click();

  // ---- A goes offline and edits locally ----
  await contextA.setOffline(true);

  const offlineText = `Offline sync ${Date.now()}`;

  await editor(pageA).click();
  await pageA.keyboard.type(offlineText);

  // A sees it locally
  await expect(editor(pageA)).toContainText(offlineText);

  // Title link should reflect locally on A (your app derives title from content)
  await pageA.waitForTimeout(500);
  await expect(pageA.getByRole("link", { name: offlineText })).toBeVisible();

  // B should NOT see it while A is offline
  await expect(pageB.getByRole("link", { name: offlineText })).toHaveCount(0);

  // ---- A comes back online; B should update after resync ----
  await contextA.setOffline(false);
  await expect(pageA.getByTestId("not-connected-logo")).toHaveCount(0);
  await expect(pageA.getByTestId("syncing-logo")).toHaveCount(1);
  await expect(pageA.getByTestId("connected-logo")).toHaveCount(1);
  await expect(pageB.getByTestId("connected-logo")).toHaveCount(1);

  // Wait for B to receive the synced title in sidebar (and ensure no duplicates)
  const syncedTitleLinksOnB = pageB.getByRole("link", { name: offlineText });
  await expect(syncedTitleLinksOnB).toHaveCount(1);

  // Open the updated page on B and confirm the editor content synced
  await syncedTitleLinksOnB.first().click();
  await expect(editor(pageB)).toContainText(offlineText);

  await contextA.close();
  await contextB.close();
});
