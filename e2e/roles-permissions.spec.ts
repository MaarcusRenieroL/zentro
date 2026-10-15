import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

import {
  addMemberDirectly,
  createProjectViaUi,
  createTaskViaUi,
  newContext,
  query,
  registerUser,
  registerWithOrganization,
  signIn,
  trpcMutation,
  trpcQuery,
  uniqueName,
} from "./helpers";

type RoleRow = {
  id: string;
  name: string;
  systemKey: string | null;
  permissions: string[];
};

const readOnlyMemberPermissions = [
  "members.view",
  "teams.view",
  "projects.view",
  "tasks.view",
  "tasks.activity.view",
  "docs.view",
  "modules.view",
];

/** Narrows the Member base role so extra roles visibly add things. */
async function makeMemberRoleReadOnly(admin: Page) {
  const roles = await trpcQuery<RoleRow[]>(admin, "permissions.roles.list");
  const memberRole = roles.find((role) => role.systemKey === "member")!;

  await trpcMutation(admin, "permissions.roles.update", {
    id: memberRole.id,
    permissions: readOnlyMemberPermissions,
  });
}

/** Creates the "Viewer plus comment" organization role through the UI. */
async function createViewerPlusComment(admin: Page, roleName: string) {
  await admin.goto("/settings/organization/roles");
  await admin.getByRole("button", { name: "New role" }).click();
  await admin.getByLabel("Name").fill(roleName);
  await admin.getByRole("button", { name: "Create role" }).click();
  await expect(admin).toHaveURL(/\/settings\/organization\/roles\/[0-9a-f-]+/);

  for (const label of [
    "View projects",
    "View tasks",
    "View docs",
    "Comment on tasks",
  ]) {
    await admin.getByRole("switch", { name: label, exact: true }).click();
  }

  await admin.getByRole("button", { name: "Save changes" }).click();
  await expect(admin.getByText("Role saved").first()).toBeVisible();
}

async function firstTaskKey(page: Page) {
  const tasks = await trpcQuery<Array<{ key: string }>>(
    page,
    "task.getTasksByOrgId",
    {},
  );

  return tasks[0]!.key;
}

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

  // Selects list people by name, so look it up.
  const [{ name }] = (await query<{ name: string }>(
    `select name from "user" where email = $1`,
    [email],
  )) as [{ name: string }];

  return { ...session, email, name };
}

test("an admin builds a custom role and assigns it to a member", async ({
  page,
  browser,
}) => {
  const orgName = uniqueName("Roles");
  const roleName = "Viewer plus comment";

  await registerWithOrganization(page, { label: "roleadmin", orgName });
  await createProjectViaUi(page, uniqueName("Role project"));
  await createTaskViaUi(page, uniqueName("Role task"));
  await makeMemberRoleReadOnly(page);

  const taskKey = await firstTaskKey(page);
  const member = await joinAsMember(browser, orgName, "roleviewer");

  // A read-only member sees the task but cannot comment or delete it.
  await member.page.goto(`/tasks/${taskKey}`);
  await expect(member.page.getByText(taskKey).first()).toBeVisible();
  await expect(member.page.getByText("Write a comment.")).toHaveCount(0);
  await expect(
    member.page.getByRole("button", { name: "Delete task" }),
  ).toHaveCount(0);

  await createViewerPlusComment(page, roleName);

  // Assign the role from the members page.
  await page.goto("/settings/organization/members");

  const row = page.getByRole("row").filter({ hasText: member.email });

  await row.getByRole("button", { name: "Open member actions" }).click();
  await page.getByRole("menuitem", { name: "Manage access" }).click();

  const dialog = page.getByRole("dialog");

  await dialog.getByRole("combobox", { name: "Role to add" }).click();
  await page.getByRole("option", { name: roleName }).click();
  await dialog.getByRole("button", { name: "Add role" }).click();
  await expect(
    dialog.getByRole("listitem").filter({ hasText: roleName }),
  ).toBeVisible();

  // The member can now comment, but still cannot edit the task.
  await member.page.reload();
  await expect(member.page.getByText("Write a comment.")).toBeVisible();

  const forbidden = await member.page.request.post(
    "/api/trpc/task.deleteTaskByKey?batch=1",
    { data: { 0: { json: { key: taskKey } } } },
  );

  expect(forbidden.status()).toBe(403);

  await member.context.close();
});

test("a private project is hidden from members until they get a role on it", async ({
  page,
  browser,
}) => {
  const orgName = uniqueName("Private");
  const projectName = uniqueName("Secret project");

  await registerWithOrganization(page, { label: "privadmin", orgName });
  await createProjectViaUi(page, projectName);

  const projects = await trpcQuery<Array<{ id: string; slug: string }>>(
    page,
    "project.getProjectsByOrgId",
  );
  const slug = projects[0]!.slug;

  await trpcMutation(page, "project.updateAccess", {
    slug,
    visibility: "private",
    teamId: null,
  });

  const member = await joinAsMember(browser, orgName, "privmember");

  await member.page.goto("/projects");
  await expect(member.page.getByText(projectName)).toHaveCount(0);

  const hidden = await member.page.request.get(
    `/api/trpc/project.getProjectBySlug?batch=1&input=${encodeURIComponent(
      JSON.stringify({ 0: { json: { slug } } }),
    )}`,
  );

  expect(hidden.status()).toBe(404);

  // The admin adds the member as a project viewer.
  await page.goto(`/projects/${slug}/settings/access`);
  await page.getByRole("button", { name: "Add people" }).click();
  await page.getByRole("combobox", { name: "Person or team" }).click();
  await page.getByRole("option", { name: new RegExp(member.name) }).click();
  await page.getByRole("combobox", { name: "Project role" }).click();
  await page.getByRole("option", { name: "Project viewer" }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Role assigned").first()).toBeVisible();

  await member.page.goto("/projects");
  await expect(member.page.getByText(projectName).first()).toBeVisible();

  await member.context.close();
});

test("a role given to a team applies to its members", async ({
  page,
  browser,
}) => {
  const orgName = uniqueName("Teamroles");
  const teamName = uniqueName("Squad");
  const roleName = "Viewer plus comment";

  await registerWithOrganization(page, { label: "teamadmin", orgName });
  await createProjectViaUi(page, uniqueName("Team project"));
  await createTaskViaUi(page, uniqueName("Team task"));
  await makeMemberRoleReadOnly(page);
  await createViewerPlusComment(page, roleName);

  const taskKey = await firstTaskKey(page);
  const member = await joinAsMember(browser, orgName, "teammember");

  const available = await trpcQuery<
    Array<{ id: string; email: string; userId: string }>
  >(page, "team.getAvailableMembers");
  const memberRow = available.find((entry) => entry.email === member.email)!;

  await trpcMutation(page, "team.create", {
    name: teamName,
    color: "blue",
    memberIds: [memberRow.id],
  });

  await member.page.goto(`/tasks/${taskKey}`);
  await expect(member.page.getByText(taskKey).first()).toBeVisible();
  await expect(member.page.getByText("Write a comment.")).toHaveCount(0);

  // Give the whole team the role from the team dialog.
  await page.goto("/settings/organization/teams");
  await page
    .locator('[data-slot="card"]')
    .filter({ hasText: teamName })
    .getByRole("button", { name: "Edit" })
    .click();

  const dialog = page.getByRole("dialog");

  await dialog.getByRole("combobox", { name: "Role for whole team" }).click();
  await page.getByRole("option", { name: roleName }).click();
  await dialog
    .getByRole("button", { name: "Assign", exact: true })
    .first()
    .click();
  await expect(
    dialog.getByRole("listitem").filter({ hasText: roleName }),
  ).toBeVisible();

  await member.page.reload();
  await expect(member.page.getByText("Write a comment.")).toBeVisible();

  await member.context.close();
});

test("the access check explains a decision and the log records changes", async ({
  page,
  browser,
}) => {
  const orgName = uniqueName("Explain");

  await registerWithOrganization(page, { label: "explainadmin", orgName });
  await makeMemberRoleReadOnly(page);

  const member = await joinAsMember(browser, orgName, "explained");

  const members = await trpcQuery<Array<{ userId: string; email: string }>>(
    page,
    "member.getMembers",
  );
  const memberUserId = members.find(
    (entry) => entry.email === member.email,
  )!.userId;

  await page.goto("/settings/organization/roles/access-check");
  await page.getByRole("combobox", { name: "Member" }).click();
  await page.getByRole("option", { name: new RegExp(member.name) }).click();
  await page.getByRole("combobox", { name: "Permission" }).click();
  await page.getByRole("option", { name: "Create tasks", exact: true }).click();
  await page.getByRole("button", { name: "Check access" }).click();

  const result = page.getByTestId("access-result");

  await expect(result.getByText("Denied", { exact: true })).toBeVisible();

  // An allow override flips the answer and says why.
  await trpcMutation(page, "permissions.overrides.set", {
    userId: memberUserId,
    permission: "tasks.create",
    effect: "allow",
    scopeType: "organization",
    scopeId: (
      await trpcQuery<RoleRow[] & Array<{ organizationId: string }>>(
        page,
        "permissions.roles.list",
      )
    )[0]!.organizationId,
    reason: "Trial period",
  });
  await page.getByRole("button", { name: "Check access" }).click();
  await expect(result.getByText("Allowed", { exact: true })).toBeVisible();
  await expect(result.getByText(/Trial period/)).toBeVisible();

  // Every change above is in the permission log.
  await page.goto("/settings/organization/roles/log");
  await expect(page.getByText("role.updated").first()).toBeVisible();
  await expect(page.getByText("override.set").first()).toBeVisible();

  await member.context.close();
});
