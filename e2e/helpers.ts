import { randomUUID } from "node:crypto";

import { expect, type Browser, type Page } from "@playwright/test";

import { randomClientIp } from "./fixtures";
import { queryTestDatabase } from "../packages/test-utils/src/database";

export const password = "E2e-pass-12345";

export function uniqueEmail(label = "user") {
  return `${label}-${randomUUID().slice(0, 8)}@example.test`;
}

export function uniqueName(label: string) {
  return `${label} ${randomUUID().slice(0, 6)}`;
}

/** Runs a query against the test database. */
export const query = queryTestDatabase;

async function waitForRow<T extends Record<string, unknown>>(
  sql: string,
  values: unknown[],
  description: string,
): Promise<T> {
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    const [row] = await query<T>(sql, values);

    if (row) {
      return row;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${description}`);
}

/** The email OTP Better Auth stored for `email` (the mail itself goes nowhere). */
export async function readOtp(email: string) {
  const row = await waitForRow<{ value: string }>(
    `select value from verification
       where identifier = $1 order by "createdAt" desc limit 1`,
    [`email-verification-otp-${email}`],
    `verification code for ${email}`,
  );

  return row.value.split(":")[0]!;
}

/** The password reset token Better Auth stored for the user with `email`. */
export async function readResetToken(email: string) {
  const row = await waitForRow<{ identifier: string }>(
    `select v.identifier from verification v
       join "user" u on u.id::text = v.value
       where v.identifier like 'reset-password:%' and u.email = $1
       order by v."createdAt" desc limit 1`,
    [email],
    `reset token for ${email}`,
  );

  return row.identifier.slice("reset-password:".length);
}

export async function readInvitationId(email: string) {
  const row = await waitForRow<{ id: string }>(
    `select id from invitation
       where email = $1 and status = 'pending'
       order by "createdAt" desc limit 1`,
    [email],
    `invitation for ${email}`,
  );

  return row.id;
}

export async function signUp(
  page: Page,
  { name, email }: { name: string; email: string },
) {
  await page.goto("/auth/sign-up");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel(/I agree to the Terms of Service/).check();
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/auth\/verify-email/);
}

export async function verifyEmail(page: Page, email: string) {
  const otp = await readOtp(email);

  await page.locator('input[autocomplete="one-time-code"]').fill(otp);
  await page.getByRole("button", { name: /verify email/i }).click();
  await expect(page).toHaveURL(/\/auth\/create-organization/);
}

export async function createOrganization(page: Page, name: string) {
  await page.getByLabel("Workspace name").fill(name);
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2 (teammates) and step 3 (modules) are optional; take the defaults.
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function signIn(page: Page, email: string, pass = password) {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(pass);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

/** Signs up, verifies the email and creates an organization through the UI. */
export async function registerWithOrganization(
  page: Page,
  { label, orgName }: { label: string; orgName: string },
) {
  const email = uniqueEmail(label);

  await signUp(page, { name: uniqueName(label), email });
  await verifyEmail(page, email);
  await createOrganization(page, orgName);

  return { email };
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
}

export async function newContext(browser: Browser) {
  const context = await browser.newContext({
    extraHTTPHeaders: { "x-forwarded-for": randomClientIp() },
  });
  const page = await context.newPage();

  return { context, page };
}

export async function createProjectViaUi(page: Page, name: string) {
  await page.goto("/projects");
  await page.getByRole("button", { name: "New project" }).click();

  const dialog = page.getByRole("dialog");

  await dialog.getByLabel("Name").fill(name);
  await dialog.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByText(name).first()).toBeVisible();
}

export async function createTaskViaUi(page: Page, name: string) {
  await page.goto("/tasks");
  await page.getByRole("button", { name: "Create task" }).first().click();

  const dialog = page.getByRole("dialog");

  await dialog.getByRole("combobox").first().click();
  await page.getByRole("option").first().click();
  await dialog.getByLabel("Task name").fill(name);
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText(name).first()).toBeVisible();
}

export async function createDocViaUi(page: Page, title: string) {
  await page.goto("/docs");
  await page.getByRole("button", { name: "New doc" }).first().click();

  const dialog = page.getByRole("dialog");

  await dialog.getByPlaceholder("Untitled product note").fill(title);
  await dialog.getByRole("button", { name: "Create doc" }).click();
  await expect(page).toHaveURL(/\/docs\/[a-z0-9-]+/);
  await expect(page.getByText(title).first()).toBeVisible();
}

/** Opens the org switcher in the sidebar. */
export async function openOrgSwitcher(page: Page) {
  await page.getByRole("button", { name: /^Organization:/ }).click();
}

export async function switchOrganization(page: Page, name: string) {
  await openOrgSwitcher(page);
  await page.getByRole("option", { name: new RegExp(name) }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("button", { name: new RegExp(`^Organization: ${name}`) }),
  ).toBeVisible();
}

/** Adds an already registered user to the organization the page is in. */
export async function addMemberDirectly(
  orgName: string,
  email: string,
  role: "member" | "admin" = "member",
) {
  await query(
    `insert into member ("organizationId", "userId", role)
       select o.id, u.id, $3 from organization o, "user" u
       where o.name = $1 and u.email = $2`,
    [orgName, email, role],
  );
}

/** Registers a verified user without an organization, through the UI. */
export async function registerUser(page: Page, label: string) {
  const email = uniqueEmail(label);

  await signUp(page, { name: uniqueName(label), email });
  await verifyEmail(page, email);

  return { email };
}

/** Calls a tRPC mutation as the signed-in user of `page`. */
export async function trpcMutation<T = unknown>(
  page: Page,
  path: string,
  input: unknown,
): Promise<T> {
  const response = await page.request.post(`/api/trpc/${path}?batch=1`, {
    data: { 0: { json: input } },
  });

  expect(response.ok(), `${path} failed`).toBe(true);

  const body = (await response.json()) as Array<{
    result: { data: { json: T } };
  }>;

  return body[0]!.result.data.json;
}

/** Calls a tRPC query as the signed-in user of `page`. */
export async function trpcQuery<T = unknown>(
  page: Page,
  path: string,
  input: unknown = null,
): Promise<T> {
  const response = await page.request.get(
    `/api/trpc/${path}?batch=1&input=${encodeURIComponent(
      JSON.stringify({ 0: { json: input } }),
    )}`,
  );

  expect(response.ok(), `${path} failed`).toBe(true);

  const body = (await response.json()) as Array<{
    result: { data: { json: T } };
  }>;

  return body[0]!.result.data.json;
}
