import { expect, test } from "./fixtures";

import {
  createOrganization,
  newContext,
  openOrgSwitcher,
  password,
  readInvitationId,
  readResetToken,
  registerUser,
  registerWithOrganization,
  signIn,
  uniqueName,
} from "./helpers";

test("a user who already belongs to an organization accepts an invitation by link", async ({
  page,
  browser,
}) => {
  const ownerOrg = uniqueName("Inviter");
  const inviteeOrg = uniqueName("Existing");

  // The owner of the organization that sends the invitation.
  await registerWithOrganization(page, { label: "inviter", orgName: ownerOrg });

  // The invitee already has an organization of their own.
  const invitee = await newContext(browser);
  const { email } = await registerUser(invitee.page, "invitee");

  await createOrganization(invitee.page, inviteeOrg);

  const response = await page.request.post(
    "/api/auth/organization/invite-member",
    {
      headers: { origin: "http://localhost:3000" },
      data: { email, role: "member" },
    },
  );

  expect(response.ok()).toBe(true);

  const invitationId = await readInvitationId(email);

  // The link works for someone who is already in another organization.
  await invitee.page.goto(`/auth/invite/${invitationId}`);
  await expect(invitee.page).toHaveURL(
    new RegExp(`/auth/invite/${invitationId}`),
  );
  await expect(invitee.page.getByText(ownerOrg).first()).toBeVisible();
  await invitee.page
    .getByRole("button", { name: /accept invitation/i })
    .click();
  await expect(invitee.page).toHaveURL(/\/dashboard/);

  // Both organizations are in the switcher and the new one is active.
  await expect(
    invitee.page
      .locator("header")
      .getByRole("button", { name: new RegExp(ownerOrg) }),
  ).toBeVisible();
  await openOrgSwitcher(invitee.page);
  await expect(
    invitee.page.getByRole("menuitem", { name: new RegExp(ownerOrg) }),
  ).toBeVisible();
  await expect(
    invitee.page.getByRole("menuitem", { name: new RegExp(inviteeOrg) }),
  ).toBeVisible();

  // The owner sees the new member.
  await page.goto("/settings/organization/members");
  await expect(page.getByText(email).first()).toBeVisible();

  await invitee.context.close();
});

test("a password reset link still works after more than 60 seconds", async ({
  page,
}) => {
  test.setTimeout(180_000);

  const { email } = await registerWithOrganization(page, {
    label: "reset",
    orgName: uniqueName("Reset"),
  });

  // Sign out by clearing the session; the reset flow is for signed-out users.
  await page.context().clearCookies();

  await page.goto("/auth/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page
    .getByRole("button", { name: /send|reset/i })
    .first()
    .click();

  const token = await readResetToken(email);

  // The token used to expire after 60 seconds.
  await page.waitForTimeout(65_000);

  await page.goto(
    `/api/auth/reset-password/${token}?callbackURL=/auth/reset-password`,
  );
  await expect(page).toHaveURL(/\/auth\/reset-password\?token=/);

  const newPassword = `${password}-new`;

  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirm password").fill(newPassword);
  await page.getByRole("button", { name: /reset password/i }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);

  await signIn(page, email, newPassword);
  await expect(page).toHaveURL(/\/dashboard/);
});
