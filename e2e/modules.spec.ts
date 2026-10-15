import { expect, test } from "./fixtures";

import {
  addMemberDirectly,
  createTaskViaUi,
  createProjectViaUi,
  newContext,
  registerUser,
  registerWithOrganization,
  signIn,
  uniqueName,
} from "./helpers";

const modulesPath = "/settings/organization/modules";

test("an admin turns Tasks off and on; dependencies are enforced", async ({
  page,
}) => {
  await registerWithOrganization(page, {
    label: "modadmin",
    orgName: uniqueName("Mods"),
  });

  const projectName = uniqueName("Kept project");
  const taskName = uniqueName("Kept task");

  await createProjectViaUi(page, projectName);
  await createTaskViaUi(page, taskName);

  // The link reads "Tasks 1" once a task is yours.
  const sidebarTasks = page.getByRole("link", { name: /^Tasks( \d+)?$/ });

  await page.goto(modulesPath);

  const tasksSwitch = page.getByRole("switch", { name: "Tasks module" });
  const projectsSwitch = page.getByRole("switch", { name: "Projects module" });
  const docsSwitch = page.getByRole("switch", { name: "Docs module" });

  // Defaults: everything is on. Turning Projects off while Tasks needs it
  // asks first instead of failing.
  await expect(tasksSwitch).toBeChecked();
  await expect(docsSwitch).toBeChecked();
  await expect(projectsSwitch).toBeChecked();
  await projectsSwitch.click();
  await expect(page.getByText("Tasks needs Projects.")).toBeVisible();
  await page.getByRole("button", { name: "Keep Projects on" }).click();
  await expect(projectsSwitch).toBeChecked();
  await expect(sidebarTasks).toBeVisible();

  // Turn Tasks off.
  await tasksSwitch.click();
  await expect(tasksSwitch).not.toBeChecked();
  await expect(projectsSwitch).toBeEnabled();
  await expect(sidebarTasks).toHaveCount(0);

  for (const path of ["/tasks", "/tasks/overview", "/tasks/PA-1"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/module-disabled\?module=tasks/);
    await expect(
      page.getByRole("heading", { name: "Tasks is turned off." }),
    ).toBeVisible();
  }

  // Docs keeps working while Tasks is off.
  await page.goto("/docs");
  await expect(
    page.getByRole("heading", { name: "Docs" }).first(),
  ).toBeVisible();

  // With Projects off as well, Tasks cannot be switched back on.
  await page.goto(modulesPath);
  await projectsSwitch.click();
  await expect(projectsSwitch).not.toBeChecked();
  await expect(tasksSwitch).toBeDisabled();
  await expect(
    page.getByText("Requires Projects to be enabled."),
  ).toBeVisible();

  // Bring both back, in dependency order.
  await projectsSwitch.click();
  await expect(projectsSwitch).toBeChecked();
  await tasksSwitch.click();
  await expect(tasksSwitch).toBeChecked();
  await expect(sidebarTasks).toBeVisible();

  // The data was kept while hidden.
  await page.goto("/tasks");
  await expect(page.getByText(taskName).first()).toBeVisible();
});

test("a plain member sees the modules page read-only", async ({
  page,
  browser,
}) => {
  const orgName = uniqueName("ReadOnly");

  await registerWithOrganization(page, { label: "owner", orgName });

  const memberSession = await newContext(browser);
  const { email } = await registerUser(memberSession.page, "member");

  await addMemberDirectly(orgName, email, "member");
  await memberSession.context.clearCookies();
  await signIn(memberSession.page, email);
  await expect(memberSession.page).toHaveURL(/\/dashboard/);

  await memberSession.page.goto(modulesPath);

  for (const name of ["Projects module", "Tasks module", "Docs module"]) {
    await expect(
      memberSession.page.getByRole("switch", { name }),
    ).toBeDisabled();
  }

  await expect(
    memberSession.page.getByText("Only owners and admins can change modules."),
  ).toBeVisible();

  await memberSession.context.close();
});
