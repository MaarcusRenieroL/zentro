import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import {
  createProjectViaUi,
  registerWithOrganization,
  uniqueName,
} from "./helpers";

// Rules of the interface, checked on the running app:
// 1. no form shows an error before it is blurred or submitted
// 2. a failed submit focuses the first invalid field
// 3. landing sections are never left invisible
// 4. at most one filled primary button per screen

const dangerText = "p.text-danger-text, [role='alert']";

async function noErrorsVisible(page: Page, where: string) {
  await expect(page.locator(dangerText), where).toHaveCount(0);
}

test("signed-out forms show no errors on open or on focus", async ({
  page,
}) => {
  for (const [path, first] of [
    ["/auth/sign-in", "Email"],
    ["/auth/sign-up", "Full name"],
    ["/auth/forgot-password", "Email"],
  ] as const) {
    await page.goto(path);
    await page.getByLabel(first).first().focus();
    await noErrorsVisible(page, path);
  }
});

test("a failed submit shows errors and focuses the first invalid field", async ({
  page,
}) => {
  await page.goto("/auth/sign-in");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(dangerText).first()).toBeVisible();
  await expect(page.getByLabel("Email")).toBeFocused();
});

test("dialogs open clean, and errors wait for blur or submit", async ({
  page,
}) => {
  await registerWithOrganization(page, {
    label: "forms",
    orgName: uniqueName("Forms"),
  });
  await createProjectViaUi(page, uniqueName("Rules"));

  await page.goto("/tasks");
  await page
    .getByRole("button", { name: /create task/i })
    .first()
    .click();
  const dialog = page.getByRole("dialog");

  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel(/task name|title/i)
    .first()
    .focus();
  await noErrorsVisible(page, "create task, focused");
  await expect(dialog.getByText(/invalid uuid/i)).toHaveCount(0);

  // Blurring an empty required field is when the error may appear.
  await dialog
    .getByLabel(/task name|title/i)
    .first()
    .blur();
  await expect(dialog.getByText(/task name is required/i)).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/projects");
  await page
    .getByRole("button", { name: /new project/i })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await noErrorsVisible(page, "create project, open");
  await page.keyboard.press("Escape");

  await page.goto("/docs");
  const newDoc = page
    .getByRole("button", { name: /new doc|create doc/i })
    .first();

  if (await newDoc.isVisible()) {
    await newDoc.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await noErrorsVisible(page, "create doc, open");
  }

  await page.goto("/settings/organization/general");
  await noErrorsVisible(page, "organization general");
  await page.goto("/settings/organization/invitations");
  await noErrorsVisible(page, "invitations");
  await page.goto("/settings/account/security");
  await noErrorsVisible(page, "security");
});

test("landing sections are visible after a jump to the bottom", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2200);

  const faint = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("main *"))
      .filter((el) => {
        const rect = el.getBoundingClientRect();

        return rect.width > 0 && rect.height > 0;
      })
      .filter((el) => {
        let node: HTMLElement | null = el;

        while (node) {
          if (Number(getComputedStyle(node).opacity) < 0.99) {
            // Decorative layers are meant to be translucent.
            return (
              !node.closest("[aria-hidden='true']") &&
              !el.closest("[aria-hidden='true']")
            );
          }

          node = node.parentElement;
        }

        return false;
      })
      .map((el) => el.tagName + "." + String(el.className).slice(0, 40))
      .slice(0, 5),
  );

  expect(faint).toEqual([]);
});

test("no screen shows more than one filled primary button", async ({
  page,
}) => {
  await registerWithOrganization(page, {
    label: "primary",
    orgName: uniqueName("Primary"),
  });
  await createProjectViaUi(page, uniqueName("Primary project"));

  const routes = [
    "/dashboard",
    "/overview",
    "/tasks",
    "/tasks/overview",
    "/projects",
    "/docs",
    "/docs/my-docs",
    "/docs/trash",
    "/settings/account/profile",
    "/settings/account/appearance",
    "/settings/account/security",
    "/settings/organization/general",
    "/settings/organization/members",
    "/settings/organization/teams",
    "/settings/organization/invitations",
    "/settings/organization/modules",
    "/settings/organization/roles",
    "/settings/organization/audit-log",
  ];

  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    const filled = await page
      .locator('[data-slot="button"][data-variant="default"]:visible')
      .evaluateAll((buttons) =>
        buttons
          .filter((button) => !(button as HTMLButtonElement).disabled)
          .map((button) => (button.textContent ?? "").trim()),
      );

    expect(filled, `${route}: ${filled.join(" | ")}`).toHaveLength(
      Math.min(filled.length, 1),
    );
  }
});
