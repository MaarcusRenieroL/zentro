import { readFileSync } from "node:fs";

import { expect, test } from "./fixtures";
import {
  addMemberDirectly,
  newContext,
  registerUser,
  registerWithOrganization,
  signIn,
  trpcMutation,
  trpcQuery,
  uniqueName,
} from "./helpers";

type Project = { id: string; slug: string };
type Item = { action: string; projectId: string | null };

async function joinAsMember(
  browser: Parameters<typeof newContext>[0],
  orgName: string,
  label: string,
) {
  const session = await newContext(browser);
  const { email } = await registerUser(session.page, label);

  await addMemberDirectly(orgName, email, "member");
  await session.context.clearCookies();
  await signIn(session.page, email);
  await expect(session.page).toHaveURL(/\/dashboard/);

  return { ...session, email };
}

test("actions show up in the feeds and the audit log, and exports download", async ({
  page,
}) => {
  const orgName = uniqueName("Activity");

  await registerWithOrganization(page, { label: "actadmin", orgName });

  const project = await trpcMutation<Project>(page, "project.createProject", {
    name: "Feed project",
    slug: "feed-project",
    description: "",
  });
  const task = await trpcMutation<{ key: string }>(page, "task.createTask", {
    projectId: project.id,
    name: "Feed task",
  });

  await trpcMutation(page, "task.updateTaskByKey", {
    key: task.key,
    status: "in-progress",
  });

  const doc = await trpcMutation<{ id: string }>(page, "docs.create", {
    projectId: project.id,
    title: "Feed doc",
    slug: "feed-doc",
  });

  await trpcMutation(page, "docs.delete", { id: doc.id });
  await trpcMutation(page, "permissions.roles.create", {
    name: "Feed role",
    scope: "organization",
    permissions: ["tasks.view"],
  });

  // Task page feed.
  await page.goto(`/tasks/${task.key}`);
  await page.getByRole("tab", { name: /history/i }).click();
  await expect(
    page.getByText(/status from To do to In progress/i).first(),
  ).toBeVisible();

  // The Today team pulse says who started what.
  await page.goto("/dashboard");
  await expect(page.getByText(`started ${task.key}`)).toBeVisible();

  // Project Activity tab.
  await page.goto(`/projects/${project.slug}`);
  await page.getByRole("tab", { name: "Activity" }).click();
  await expect(
    page
      .getByTestId("activity-feed")
      .getByText(/moved the doc Feed doc to the trash/),
  ).toBeVisible();

  // Audit log, with the permission change and the filters.
  await page.goto("/settings/organization/audit-log");
  await expect(page.getByText("created the role Feed role")).toBeVisible();
  await expect(
    page.getByText(`moved ${task.key} from To do to In progress`),
  ).toBeVisible();

  // Filters apply as you type.
  await page.getByLabel("Search").fill("Feed role");
  await expect(page.getByText(`moved ${task.key}`)).toHaveCount(0);
  await page.getByText("created the role Feed role").click();
  await expect(
    page.getByRole("dialog").getByText("role.created").first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  // CSV export.
  await page.getByLabel("Search").fill("");
  await expect(page.getByText("created the role Feed role")).toBeVisible();
  await expect(page.getByText(`moved ${task.key}`)).toBeVisible();

  const download = page.waitForEvent("download");

  await page.getByRole("button", { name: "Export CSV" }).click();

  const file = await (await download).path();
  const csv = readFileSync(file!, "utf8");

  expect(csv.split("\r\n")[0]).toContain("time,actor,action");
  expect(csv).toContain("task.created");
  expect(csv).toContain("role.created");

  // The export itself was recorded.
  await page.reload();
  await expect(page.getByText("exported the audit log").first()).toBeVisible();

  // The permission log still works from the new store.
  await page.goto("/settings/organization/roles/log");
  await expect(page.getByText("role.created").first()).toBeVisible();
});

test("a plain member has no audit log, and a private project's events stay hidden", async ({
  page,
  browser,
}) => {
  const orgName = uniqueName("Activityhide");

  await registerWithOrganization(page, { label: "hideadmin", orgName });

  const project = await trpcMutation<Project>(page, "project.createProject", {
    name: "Hidden feed",
    slug: "hidden-feed",
    description: "",
  });

  await trpcMutation(page, "project.updateAccess", {
    slug: project.slug,
    visibility: "private",
    teamId: null,
  });

  const task = await trpcMutation<{ key: string }>(page, "task.createTask", {
    projectId: project.id,
    name: "Private work",
  });

  const member = await joinAsMember(browser, orgName, "hidemember");

  await member.page.goto("/settings/organization/audit-log");
  await expect(member.page.getByText(/You don.t have access/)).toBeVisible();
  await expect(
    member.page.getByRole("link", { name: "Audit log" }),
  ).toHaveCount(0);

  const audit = await member.page.request.get(
    `/api/trpc/audit.list?batch=1&input=${encodeURIComponent(
      JSON.stringify({ 0: { json: {} } }),
    )}`,
  );

  expect(audit.status()).toBe(403);

  const feed = await trpcQuery<{ items: Item[] }>(
    member.page,
    "activity.list",
    {
      projectId: project.id,
    },
  );

  expect(feed.items).toEqual([]);

  await member.page.goto("/dashboard");
  await expect(member.page.getByText(task.key)).toHaveCount(0);

  // The admin does see it.
  await page.goto("/dashboard");
  await expect(page.getByText(`created ${task.key}`).first()).toBeVisible();

  await member.context.close();
});
