import { expect, test } from "./fixtures";

import {
  createOrganization,
  createTaskViaUi,
  createProjectViaUi,
  openOrgSwitcher,
  registerWithOrganization,
  switchOrganization,
  trpcMutation,
  trpcQuery,
  uniqueName,
} from "./helpers";

type Project = { id: string; slug: string };

async function createProject(
  page: Parameters<typeof trpcMutation>[0],
  name: string,
) {
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  return trpcMutation<Project>(page, "project.createProject", {
    name,
    slug,
    description: "",
  });
}

test.describe("task overview", () => {
  test("shows only the current organization's data", async ({ page }) => {
    const orgA = uniqueName("OverviewA");
    const orgB = uniqueName("OverviewB");
    const taskA = uniqueName("Overview task A");
    const taskB = uniqueName("Overview task B");

    await registerWithOrganization(page, { label: "overview", orgName: orgA });
    await createProjectViaUi(page, uniqueName("Proj"));
    await createTaskViaUi(page, taskA);

    await openOrgSwitcher(page);
    await page.getByRole("menuitem", { name: "Create organization" }).click();
    await createOrganization(page, orgB);
    await createProjectViaUi(page, uniqueName("Proj"));
    await createTaskViaUi(page, taskB);

    // Organization B (active) sees only B's task, and a total of one.
    await page.goto("/tasks/overview");
    await expect(page.getByText(taskB).first()).toBeVisible();
    await expect(page.getByText(taskA)).toHaveCount(0);
    await expect(page.getByText("Total work items")).toBeVisible();
    await expect(
      page
        .getByText("Total work items")
        .locator("xpath=preceding-sibling::span"),
    ).toHaveText("1");

    await switchOrganization(page, orgA);
    await page.goto("/tasks/overview");
    await expect(page.getByText(taskA).first()).toBeVisible();
    await expect(page.getByText(taskB)).toHaveCount(0);
  });

  test("an empty organization shows empty states, not sample data", async ({
    page,
  }) => {
    await registerWithOrganization(page, {
      label: "emptyoverview",
      orgName: uniqueName("EmptyOverview"),
    });
    await page.goto("/tasks/overview");

    await expect(
      page.getByText("No open tasks are assigned to you."),
    ).toBeVisible();
    await expect(page.getByText("Nothing is overdue.")).toBeVisible();
    await expect(page.getByText("No task activity yet.")).toBeVisible();
    await expect(
      page
        .getByText("Total work items")
        .locator("xpath=preceding-sibling::span"),
    ).toHaveText("0");
  });
});

test("the old task project routes redirect permanently to /projects", async ({
  page,
}) => {
  const list = await page.request.get("/tasks/projects", { maxRedirects: 0 });

  expect(list.status()).toBe(308);
  expect(
    new URL(list.headers().location!, "http://localhost:3000").pathname,
  ).toBe("/projects");

  const detail = await page.request.get("/tasks/projects/some-project", {
    maxRedirects: 0,
  });

  expect(detail.status()).toBe(308);
  expect(
    new URL(detail.headers().location!, "http://localhost:3000").pathname,
  ).toBe("/projects/some-project");
});

test("the dashboard shows numbers computed from the database", async ({
  page,
}) => {
  await registerWithOrganization(page, {
    label: "dashcounts",
    orgName: uniqueName("DashCounts"),
  });

  const first = await createProject(page, "Counted one");

  await createProject(page, "Counted two");

  for (const name of ["T1", "T2", "T3"]) {
    await trpcMutation(page, "task.createTask", {
      projectId: first.id,
      name,
    });
  }

  await trpcMutation(page, "docs.create", {
    title: "Counted doc",
    slug: `counted-doc-${Math.random().toString(36).slice(2, 6)}`,
  });

  await page.goto("/dashboard");

  const overview = page
    .getByRole("heading", { name: "Workspace overview" })
    .locator("xpath=..");
  const text = async () =>
    ((await overview.innerText()) ?? "").replace(/\s+/g, " ");

  await expect.poll(text).toContain("1 Members");
  await expect.poll(text).toContain("2 Projects");
  await expect.poll(text).toContain("3 Open tasks");
  await expect.poll(text).toContain("1 Docs");
  await expect.poll(text).toContain("0 Teams");

  await expect(page.getByText("3 tasks due")).toHaveCount(0);
  await expect(page.getByText(/mentions?/i)).toHaveCount(0);
  await expect(page.getByText(/events today/i)).toHaveCount(0);
  await expect(page.getByText("1 doc updated")).toBeVisible();
});

test("the sidebar highlights exactly one item per route", async ({ page }) => {
  await registerWithOrganization(page, {
    label: "sidebar",
    orgName: uniqueName("Sidebar"),
  });

  const routes: Array<[string, string]> = [
    ["/dashboard", "Dashboard"],
    ["/projects", "All projects"],
    ["/projects?status=active", "Active projects"],
    ["/tasks", "All tasks"],
    ["/tasks/overview", "Overview"],
    ["/tasks?status=done", "Completed"],
    ["/docs", "All docs"],
    ["/docs/recent", "Recent"],
    ["/settings/organization/modules", "Modules"],
  ];

  for (const [route, label] of routes) {
    await page.goto(route);

    const active = page.locator(
      '[data-sidebar="menu-button"][data-active="true"], [data-sidebar="menu-sub-button"][data-active="true"]',
    );

    await expect(active, route).toHaveCount(1);
    await expect(active, route).toContainText(label);
  }
});

test("the calendar opens on the current month and places tasks by due date", async ({
  page,
}) => {
  await registerWithOrganization(page, {
    label: "calendar",
    orgName: uniqueName("Calendar"),
  });

  const project = await createProject(page, "Calendar project");
  const today = new Date();
  const dueToday = await trpcMutation<{ key: string }>(
    page,
    "task.createTask",
    {
      projectId: project.id,
      name: "Due today",
      dueAt: today.toISOString(),
    },
  );
  const undated = await trpcMutation<{ key: string }>(page, "task.createTask", {
    projectId: project.id,
    name: "No due date",
  });

  await page.goto("/tasks");
  await page.getByRole("tab", { name: "Calendar" }).click();

  const monthLabel = today.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  await expect(page.getByText(monthLabel, { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: new RegExp(dueToday.key) }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: new RegExp(undated.key) }),
  ).toHaveCount(0);

  // Next month does not contain the task.
  await page.getByRole("button", { name: "Next month" }).click();
  await expect(
    page.getByRole("link", { name: new RegExp(dueToday.key) }),
  ).toHaveCount(0);
});

test("every page of a fresh account shows empty states without sample data", async ({
  page,
}) => {
  await registerWithOrganization(page, {
    label: "tour",
    orgName: uniqueName("Tour"),
  });

  const errors: string[] = [];

  page.on("pageerror", (error) => errors.push(error.message));

  const routes = [
    "/dashboard",
    "/projects",
    "/tasks",
    "/tasks/overview",
    "/docs",
    "/docs/my-docs",
    "/docs/recent",
    "/docs/projects",
    "/docs/trash",
    "/settings/organization/general",
    "/settings/organization/members",
    "/settings/organization/teams",
    "/settings/organization/invitations",
    "/settings/organization/modules",
    "/settings/organization/danger",
  ];
  const banned = [
    "Maarcus",
    "Sprint 0",
    "June 2026",
    "Congratulate ruby",
    "Define project scope",
    "Connect task filters",
  ];

  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    const text = await page.locator("body").innerText();

    expect(text, route).not.toContain("Something went wrong");

    for (const word of banned) {
      expect(text, `${route}: ${word}`).not.toContain(word);
    }
  }

  // The bell opens an honest empty state.
  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText("No notifications yet")).toBeVisible();

  // Task detail of a task that does not exist.
  await page.goto("/tasks/NOPE-1");
  await expect(page.getByText("Task not found")).toBeVisible();

  expect(errors).toEqual([]);
  expect(await trpcQuery(page, "task.getTasksByOrgId", {})).toEqual([]);
});
