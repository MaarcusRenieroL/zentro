import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

import {
  addMemberDirectly,
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
  organizationId: string;
};
type MemberRow = { id: string; userId: string; email: string };

async function setMemberRole(admin: Page, permissions: string[]) {
  const roles = await trpcQuery<RoleRow[]>(admin, "permissions.roles.list");
  const memberRole = roles.find((role) => role.systemKey === "member")!;

  await trpcMutation(admin, "permissions.roles.update", {
    id: memberRole.id,
    permissions,
  });
}

async function systemRoleId(admin: Page, systemKey: string) {
  const roles = await trpcQuery<RoleRow[]>(admin, "permissions.roles.list");

  return roles.find((role) => role.systemKey === systemKey)!.id;
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

  const [row] = await query<{ name: string; id: string }>(
    `select name, id from "user" where email = $1`,
    [email],
  );

  return { ...session, email, name: row!.name, userId: row!.id };
}

async function createProject(admin: Page, name: string) {
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`.slice(0, 60);
  const project = await trpcMutation<{ id: string; slug: string }>(
    admin,
    "project.createProject",
    { name, slug, description: "" },
  );

  return project;
}

test("a user whose only access is a project role sees that module and only that project", async ({
  page,
  browser,
}) => {
  const orgName = uniqueName("Projectonly");
  const alpha = uniqueName("Alpha scope");
  const beta = uniqueName("Beta scope");

  await registerWithOrganization(page, { label: "poadmin", orgName });

  const alphaProject = await createProject(page, alpha);
  const betaProject = await createProject(page, beta);

  for (const [project, label] of [
    [alphaProject, "alpha"],
    [betaProject, "beta"],
  ] as const) {
    await trpcMutation(page, "task.createTask", {
      projectId: project.id,
      name: `${label} work item`,
    });
    await trpcMutation(page, "docs.create", {
      projectId: project.id,
      title: `${label} handbook`,
      slug: `${label}-handbook-${project.id.slice(0, 6)}`,
    });
  }

  // Nothing organization-wide that reveals projects, tasks or docs.
  await setMemberRole(page, ["modules.view"]);

  const worker = await joinAsMember(browser, orgName, "projectonly");

  // Without a role on any project there is nothing to open.
  await worker.page.goto("/projects");
  await expect(worker.page.getByText(/You don.t have access/)).toBeVisible();
  await expect(
    worker.page.getByRole("link", { name: "Projects", exact: true }),
  ).toHaveCount(0);

  const members = await trpcQuery<MemberRow[]>(page, "member.getMembers");
  const userId = members.find((entry) => entry.email === worker.email)!.userId;

  await trpcMutation(page, "permissions.assignments.assign", {
    roleId: await systemRoleId(page, "project_member"),
    principalType: "user",
    principalId: userId,
    scopeType: "project",
    scopeId: alphaProject.id,
  });

  // Sidebar items follow the project role.
  await worker.page.goto("/dashboard");
  for (const name of ["Projects", "Tasks", "Docs"]) {
    await expect(
      worker.page.getByRole("link", { name, exact: true }).first(),
    ).toBeVisible();
  }

  // Quick actions on the dashboard link to the modules, too.
  await expect(
    worker.page.getByRole("link", { name: "Projects" }).last(),
  ).toBeVisible();

  await worker.page.goto("/projects");
  await expect(worker.page.getByText(alpha).first()).toBeVisible();
  await expect(worker.page.getByText(beta)).toHaveCount(0);

  await worker.page.goto("/tasks");
  await expect(worker.page.getByText("alpha work item").first()).toBeVisible();
  await expect(worker.page.getByText("beta work item")).toHaveCount(0);

  await worker.page.goto("/docs");
  await expect(worker.page.getByText("alpha handbook").first()).toBeVisible();
  await expect(worker.page.getByText("beta handbook")).toHaveCount(0);

  // The project opens, with its task and doc counts.
  await worker.page.goto(`/projects/${alphaProject.slug}`);
  await expect(worker.page.getByText(alpha).first()).toBeVisible();

  // The other project is out of reach by URL too.
  const other = await worker.page.request.get(
    `/api/trpc/project.getProjectBySlug?batch=1&input=${encodeURIComponent(
      JSON.stringify({ 0: { json: { slug: betaProject.slug } } }),
    )}`,
  );

  expect(other.status()).toBe(403);

  await worker.context.close();
});

test("a team lead manages their own team without any organization-wide role access", async ({
  page,
  browser,
}) => {
  const orgName = uniqueName("Teamlead");
  const ownTeam = uniqueName("Lead squad");
  const otherTeam = uniqueName("Other squad");

  await registerWithOrganization(page, { label: "tladmin", orgName });

  const lead = await joinAsMember(browser, orgName, "teamlead");
  const mate = await joinAsMember(browser, orgName, "teammate");
  const available = await trpcQuery<MemberRow[]>(
    page,
    "team.getAvailableMembers",
  );
  const memberId = (email: string) =>
    available.find((entry) => entry.email === email)!;

  const team = await trpcMutation<{ id: string }>(page, "team.create", {
    name: ownTeam,
    color: "blue",
    memberIds: [memberId(lead.email).id, memberId(mate.email).id],
  });

  await trpcMutation(page, "team.create", {
    name: otherTeam,
    color: "green",
    memberIds: [],
  });
  await trpcMutation(page, "permissions.assignments.assign", {
    roleId: await systemRoleId(page, "team_lead"),
    principalType: "user",
    principalId: memberId(lead.email).userId,
    scopeType: "team",
    scopeId: team.id,
  });

  await lead.page.goto("/settings/organization/teams");

  const ownCard = lead.page
    .locator('[data-slot="card"]')
    .filter({ hasText: ownTeam });
  const otherCard = lead.page
    .locator('[data-slot="card"]')
    .filter({ hasText: otherTeam });

  // They manage their own team, and only theirs.
  await expect(ownCard.getByRole("button", { name: "Members" })).toBeEnabled();
  await expect(
    otherCard.getByRole("button", { name: "Members" }),
  ).toBeDisabled();
  await expect(ownCard.getByRole("button", { name: "Edit" })).toBeDisabled();

  await ownCard.getByRole("button", { name: "Members" }).click();

  const dialog = lead.page.getByRole("dialog");
  const panel = dialog.getByTestId("team-roles-panel");

  await expect(panel).toBeVisible();
  // Their own lead role is listed.
  await expect(
    panel.getByRole("listitem").filter({ hasText: lead.name }),
  ).toBeVisible();

  await panel.getByRole("combobox", { name: "Team member" }).click();
  await lead.page.getByRole("option", { name: mate.name }).click();
  await panel.getByRole("combobox", { name: "Team role" }).click();
  await lead.page
    .getByRole("option", { name: "Team member", exact: true })
    .click();
  await panel.getByRole("button", { name: "Assign", exact: true }).click();
  await expect(
    panel.getByRole("listitem").filter({ hasText: mate.name }),
  ).toBeVisible();

  const rows = await query<{ roleName: string }>(
    `select r.name as "roleName" from "roleAssignment" a
       join role r on r.id = a."roleId"
       where a."scopeId" = $1 and a."principalId" = $2`,
    [team.id, mate.userId],
  );

  expect(rows.map((row) => row.roleName)).toContain("Team member");

  // No organization-wide role access: the roles API stays closed to them.
  const roles = await lead.page.request.get(
    "/api/trpc/permissions.roles.list?batch=1&input=" +
      encodeURIComponent(JSON.stringify({ 0: { json: null } })),
  );

  expect(roles.status()).toBe(403);

  await lead.context.close();
  await mate.context.close();
});

test("edit and delete controls follow who created the task or doc", async ({
  page,
  browser,
}) => {
  const orgName = uniqueName("Ownership");

  await registerWithOrganization(page, { label: "owadmin", orgName });

  const project = await createProject(page, uniqueName("Own project"));

  await setMemberRole(page, [
    "projects.view",
    "members.view",
    "teams.view",
    "modules.view",
    "tasks.view",
    "tasks.create",
    "tasks.update_own",
    "tasks.delete_own",
    "tasks.activity.view",
    "docs.view",
    "docs.create",
    "docs.update_own",
    "docs.trash_own",
  ]);

  const anyRole = await trpcMutation<{ id: string }>(
    page,
    "permissions.roles.create",
    {
      name: "Edit anything",
      scope: "organization",
      permissions: [
        "tasks.update_any",
        "tasks.delete_any",
        "docs.update_any",
        "docs.trash_any",
      ],
    },
  );

  const author = await joinAsMember(browser, orgName, "author");
  const other = await joinAsMember(browser, orgName, "other");
  const editor = await joinAsMember(browser, orgName, "editor");
  const members = await trpcQuery<MemberRow[]>(page, "member.getMembers");

  await trpcMutation(page, "permissions.assignments.assign", {
    roleId: anyRole.id,
    principalType: "user",
    principalId: members.find((entry) => entry.email === editor.email)!.userId,
    scopeType: "organization",
    scopeId: (await trpcQuery<RoleRow[]>(page, "permissions.roles.list"))[0]!
      .organizationId,
  });

  const mine = await trpcMutation<{ key: string; name: string }>(
    author.page,
    "task.createTask",
    { projectId: project.id, name: "Written by the author" },
  );
  const theirs = await trpcMutation<{ key: string; name: string }>(
    other.page,
    "task.createTask",
    { projectId: project.id, name: "Written by the other" },
  );
  const myDoc = await trpcMutation<{ slug: string }>(
    author.page,
    "docs.create",
    {
      projectId: project.id,
      title: "Author doc",
      slug: `author-doc-${project.id.slice(0, 6)}`,
    },
  );
  const theirDoc = await trpcMutation<{ slug: string }>(
    other.page,
    "docs.create",
    {
      projectId: project.id,
      title: "Other doc",
      slug: `other-doc-${project.id.slice(0, 6)}`,
    },
  );

  // The page asks the server what the person may do with this one item; wait
  // for that answer before reading the controls.
  const openItem = async (viewer: Page, url: string) => {
    const answered = viewer.waitForResponse((response) =>
      response.url().includes("permissions.check"),
    );

    await viewer.goto(url);
    await answered;
    await viewer.waitForLoadState("networkidle");
  };
  const taskControls = async (viewer: Page, task: typeof mine) => {
    await openItem(viewer, `/tasks/${task.key}`);
    await expect(viewer.getByText(task.key).first()).toBeVisible();

    return {
      canDelete: await viewer
        .getByRole("button", { name: "Delete task" })
        .count(),
      canEdit: await viewer
        .getByRole("button", { name: task.name, exact: true })
        .isEnabled(),
    };
  };
  const docControls = async (viewer: Page, doc: typeof myDoc) => {
    await openItem(viewer, `/docs/${doc.slug}`);
    await expect(viewer.getByText("Page actions")).toBeAttached();
    await viewer.getByRole("button", { name: "Page actions" }).click();

    const canTrash = await viewer
      .getByRole("menuitem", { name: "Move to trash" })
      .count();

    await viewer.keyboard.press("Escape");

    return {
      canTrash,
      canEdit:
        (await viewer
          .locator('.docs-editor-content[contenteditable="true"]')
          .count()) > 0,
    };
  };

  // `_own`: only on what they created.
  expect(await taskControls(author.page, mine)).toEqual({
    canDelete: 1,
    canEdit: true,
  });
  expect(await taskControls(author.page, theirs)).toEqual({
    canDelete: 0,
    canEdit: false,
  });
  expect(await docControls(author.page, myDoc)).toEqual({
    canTrash: 1,
    canEdit: true,
  });
  expect(await docControls(author.page, theirDoc)).toEqual({
    canTrash: 0,
    canEdit: false,
  });

  // `_any`: on everything.
  expect(await taskControls(editor.page, mine)).toEqual({
    canDelete: 1,
    canEdit: true,
  });
  expect(await taskControls(editor.page, theirs)).toEqual({
    canDelete: 1,
    canEdit: true,
  });
  expect(await docControls(editor.page, theirDoc)).toEqual({
    canTrash: 1,
    canEdit: true,
  });

  // The controls are not the only line of defence.
  const refused = await author.page.request.post(
    "/api/trpc/task.deleteTaskByKey?batch=1",
    { data: { 0: { json: { key: theirs.key } } } },
  );

  expect(refused.status()).toBe(403);

  await author.context.close();
  await other.context.close();
  await editor.context.close();
});
