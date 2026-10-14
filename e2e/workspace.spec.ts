import { expect, test } from "./fixtures";

import {
  createDocViaUi,
  createProjectViaUi,
  createTaskViaUi,
  createOrganization,
  openOrgSwitcher,
  registerWithOrganization,
  switchOrganization,
  uniqueName,
} from "./helpers";

test.describe("projects, tasks and docs", () => {
  test("create and open a project, a task and a doc", async ({ page }) => {
    await registerWithOrganization(page, {
      label: "builder",
      orgName: uniqueName("Builders"),
    });

    const projectName = uniqueName("Website");
    const taskName = uniqueName("Draft copy");
    const docTitle = uniqueName("Handbook");

    await createProjectViaUi(page, projectName);
    await page.getByText(projectName).first().click();
    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/);
    await expect(
      page.getByRole("heading", { name: projectName }).first(),
    ).toBeVisible();

    await createTaskViaUi(page, taskName);
    await page.getByText(taskName).first().click();
    await expect(page).toHaveURL(/\/tasks\/[A-Z0-9]+-1/);
    await expect(page.getByText(taskName).first()).toBeVisible();

    await createDocViaUi(page, docTitle);
    await page.goto("/docs");
    await page.getByText(docTitle).first().click();
    await expect(page).toHaveURL(/\/docs\/[a-z0-9-]+/);
    await expect(page.getByText(docTitle).first()).toBeVisible();
  });
});

test.describe("two organizations", () => {
  test("switching organizations switches the data", async ({ page }) => {
    const orgA = uniqueName("Alpha");
    const orgB = uniqueName("Beta");

    await registerWithOrganization(page, { label: "twoorgs", orgName: orgA });

    const projectA = uniqueName("Proj-A");
    const taskA = uniqueName("Task-A");
    const docA = uniqueName("Doc-A");

    await createProjectViaUi(page, projectA);
    await createTaskViaUi(page, taskA);
    await createDocViaUi(page, docA);

    // Second organization for the same user, created through the switcher.
    await openOrgSwitcher(page);
    await page.getByRole("link", { name: "Create organization" }).click();
    await expect(page).toHaveURL(/\/auth\/create-organization/);
    await createOrganization(page, orgB);

    // Organization B starts empty.
    for (const [path, leaked] of [
      ["/projects", projectA],
      ["/tasks", taskA],
      ["/docs", docA],
    ] as const) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(leaked)).toHaveCount(0);
    }

    const projectB = uniqueName("Proj-B");

    await createProjectViaUi(page, projectB);

    // Back to A: A's data is there, B's is not.
    await switchOrganization(page, orgA);
    await page.goto("/projects");
    await expect(page.getByText(projectA).first()).toBeVisible();
    await expect(page.getByText(projectB)).toHaveCount(0);

    await page.goto("/tasks");
    await expect(page.getByText(taskA).first()).toBeVisible();

    await page.goto("/docs");
    await expect(page.getByText(docA).first()).toBeVisible();

    // And B again shows its own project only.
    await switchOrganization(page, orgB);
    await page.goto("/projects");
    await expect(page.getByText(projectB).first()).toBeVisible();
    await expect(page.getByText(projectA)).toHaveCount(0);
  });
});
