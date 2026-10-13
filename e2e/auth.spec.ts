import { expect, test } from "./fixtures";

import {
  createOrganization,
  password,
  registerWithOrganization,
  signIn,
  signOut,
  signUp,
  uniqueEmail,
  uniqueName,
  verifyEmail,
} from "./helpers";

test.describe("sign-up and session", () => {
  test("sign up, verify the OTP, create an organization, sign out and back in", async ({
    page,
  }) => {
    const email = uniqueEmail("alice");

    await signUp(page, { name: uniqueName("Alice"), email });
    await verifyEmail(page, email);
    await createOrganization(page, uniqueName("Acme"));

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Alice",
    );

    await signOut(page);
    await signIn(page, email);
    await expect(page).toHaveURL(/\/dashboard/);

    // The session survives a hard refresh.
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Alice",
    );
  });

  test("a wrong password does not sign in", async ({ page }) => {
    const { email } = await registerWithOrganization(page, {
      label: "wrongpass",
      orgName: uniqueName("Wrong"),
    });

    await signOut(page);
    await signIn(page, email, `${password}-nope`);
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});

test.describe("signed out", () => {
  for (const path of [
    "/dashboard",
    "/projects",
    "/tasks",
    "/docs",
    "/settings",
  ]) {
    test(`${path} redirects to sign-in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth\/sign-in/);
    });
  }
});
