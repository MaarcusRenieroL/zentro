import { randomInt } from "node:crypto";

import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";

export function randomClientIp() {
  return `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`;
}

// Better Auth rate-limits by client IP (for example 3 verification emails per
// minute), and every test shares 127.0.0.1. Give each test its own forwarded
// address so tests do not throttle each other.
export const test = base.extend({
  extraHTTPHeaders: async ({}, use) => {
    await use({ "x-forwarded-for": randomClientIp() });
  },
});
