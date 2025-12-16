import { test, expect } from "./test.setup.delay";
import { waitForAppReady, editor } from "./utils";

test("Offline/reconnect: edits apply locally and stay consistent after reconnect", async ({
  page,
}) => {
  await waitForAppReady(page);

  // Go offline
  await page.context().setOffline(true);

  await page.getByRole("button", { name: "New page" }).click();
  const pageLink = page.getByRole("link", { name: "Untitled page" }).last();
  await expect(pageLink).toBeVisible();

  await pageLink.click();
  const e = editor(page);
  await e.click();

  const text = `Offline note ${Date.now()}`;
  await page.keyboard.type(text);

  // Local UI should reflect changes even offline
  await expect(e).toContainText(text);
  await expect(page.getByRole("link", { name: text })).toBeVisible();

  // Reconnect
  await page.context().setOffline(false);
  await expect(page.getByTestId("syncing-logo")).toHaveCount(1);
  // Give the app time to resync; assert stable state (no duplicates)
  const titleLinks = page.getByRole("link", { name: text });
  await expect(titleLinks).toHaveCount(1);

  // Still readable after reconnect
  await expect(editor(page)).toContainText(text);
});
