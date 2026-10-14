import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import {
  createProjectViaUi,
  createTaskViaUi,
  registerWithOrganization,
  uniqueName,
} from "./helpers";

// Rules of the interface, checked on the running app:
// 1. no form shows an error before it is blurred or submitted
// 2. a failed submit focuses the first invalid field
// 3. landing sections are never left invisible
// 4. at most one filled primary button per screen

const dangerText = "p.text-danger-text, [role='alert']:not(:empty)";

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
            // Decorative layers and intentionally dimmed ("coming") tiles.
            return !el.closest(
              "[aria-hidden='true'], [data-dim], [disabled], [data-disabled]",
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
  test.setTimeout(240_000);
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
    await page.waitForTimeout(1200);

    // Judged by what is painted: any visible button or link filled with the
    // accent. Switches are toggles, not buttons.
    const filled = await page.evaluate(() => {
      const probe = document.createElement("div");

      probe.style.background = "var(--signal)";
      document.body.appendChild(probe);

      const accent = getComputedStyle(probe).backgroundColor;

      probe.remove();

      return Array.from(document.querySelectorAll("button, a"))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);

          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== "hidden" &&
            style.backgroundColor === accent &&
            element.getAttribute("role") !== "switch" &&
            !(element as HTMLButtonElement).disabled
          );
        })
        .map((element) => (element.textContent ?? "").trim());
    });

    expect(filled, `${route}: ${filled.join(" | ")}`).toHaveLength(
      Math.min(filled.length, 1),
    );
  }
});

test("Today: an empty workspace asks for a task, then start and finish work", async ({
  page,
}) => {
  await registerWithOrganization(page, {
    label: "today",
    orgName: uniqueName("Today"),
  });
  await createProjectViaUi(page, uniqueName("Today project"));

  // No tasks at all: no celebration, a way to create one.
  await page.goto("/dashboard");
  await expect(page.getByText("No tasks yet.")).toBeVisible();
  await expect(page.getByText("Nothing left today.")).toHaveCount(0);
  await expect(page.getByText("Nothing planned").first()).toBeVisible();

  const name = uniqueName("Ship it");

  await createTaskViaUi(page, name);

  // A task nobody owns can be pulled in, started, and finished.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /pull in/i }).click();
  await expect(page.getByRole("button", { name: /^start/i })).toBeVisible();
  await page.getByRole("button", { name: /^start/i }).click();
  await expect(page.getByRole("button", { name: /mark done/i })).toBeVisible();
  await expect(page.getByRole("timer")).toBeVisible();
  await page.getByRole("button", { name: /mark done/i }).click();
  await expect(page.getByText("Nothing left today.")).toBeVisible({
    timeout: 10_000,
  });
});

test("keyboard focus is visible on sign-in", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await page.keyboard.press("Tab");

  const outline = await page.evaluate(() => {
    const style = getComputedStyle(document.activeElement as Element);

    return {
      width: parseFloat(style.outlineWidth),
      shadow: style.boxShadow,
      tag: document.activeElement?.tagName,
    };
  });

  expect(outline.tag).not.toBe("BODY");
  expect(outline.width > 0 || outline.shadow !== "none").toBe(true);
});
