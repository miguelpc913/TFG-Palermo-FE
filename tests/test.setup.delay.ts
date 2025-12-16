// tests/setup/delay.ts
import { test as base } from "@playwright/test";

export const test = base.extend({});

test.afterEach(async () => {
  await new Promise(res => setTimeout(res, 3000)); // 1s delay
});

export { expect } from "@playwright/test";
