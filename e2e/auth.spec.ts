import { expect, test } from "@playwright/test";
import { E2E_PASSWORD, E2E_USERS, login } from "./helpers";

test.describe("authentication", () => {
  test("redirects an unauthenticated visitor to the login page", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("shows an inline error for a wrong password and stays on /login", async ({ page }) => {
    await login(page, E2E_USERS.rotated.email, "totally-wrong");
    await expect(page.getByRole("alert")).toHaveText("Invalid email or password");
    await expect(page).toHaveURL(/\/login/);
  });

  test("refuses an email outside the university domain", async ({ page }) => {
    await login(page, "someone@gmail.com");
    await expect(page.getByRole("alert")).toContainText("@stu.kau.edu.sa");
    await expect(page).toHaveURL(/\/login/);
  });

  test("tells an unrostered university email it is not authorised", async ({ page }) => {
    await login(page, "not.on.the.team@stu.kau.edu.sa");
    await expect(page.getByRole("alert")).toContainText("not authorised");
    await expect(page).toHaveURL(/\/login/);
  });

  test("signs in an activated account and lands on the dashboard", async ({ page }) => {
    await login(page, E2E_USERS.rotated.email);
    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.getByRole("heading", { name: "Tasks", exact: true })).toBeVisible();
    await expect(page.getByText(E2E_USERS.rotated.displayName)).toBeVisible();
  });

  test("forces a temporary-password account through the change screen and blocks bypass", async ({
    page,
  }) => {
    await login(page, E2E_USERS.fresh.email);
    await expect(page).toHaveURL(/\/change-password/);

    // Trying to jump straight to the dashboard bounces back.
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/change-password/);

    const newPassword = "StackedUp2026";
    await page.getByLabel("Current password").fill(E2E_PASSWORD);
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password").fill(newPassword);
    await page.getByRole("button", { name: "Update password" }).click();

    await expect(page).toHaveURL(/\/tasks/);

    // Log out, then confirm the old temporary password is dead and the new one works.
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login/);

    await login(page, E2E_USERS.fresh.email, E2E_PASSWORD);
    await expect(page.getByRole("alert")).toHaveText("Invalid email or password");

    await login(page, E2E_USERS.fresh.email, newPassword);
    await expect(page).toHaveURL(/\/tasks/);
  });

  test("logging out invalidates the session", async ({ page }) => {
    await login(page, E2E_USERS.rotated.email);
    await expect(page).toHaveURL(/\/tasks/);

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login/);
  });
});
