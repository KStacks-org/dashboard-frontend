import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { E2E_USERS, signInAs } from "./helpers";

test.describe("authentication", () => {
  test("sends an unauthenticated visitor toward auth-service's login", async ({ page }) => {
    await page.goto("/tasks");
    await page.waitForURL(/__e2e_login_redirect__/);
  });

  test("shows the no-access page for a real identity that is not on the roster", async ({
    page,
  }) => {
    await signInAs(page, {
      id: randomUUID(),
      email: "not.on.the.team@stu.kau.edu.sa",
      displayName: "Not On The Team",
    });
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/no-access/);
    await expect(page.getByRole("heading", { name: "No access yet" })).toBeVisible();
  });

  test("signs a rostered account straight in — no login form involved", async ({ page }) => {
    await signInAs(page, E2E_USERS.rotated);
    await page.goto("/overview");
    await expect(page).toHaveURL(/\/overview/);
    await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
    await expect(page.getByText(E2E_USERS.rotated.displayName)).toBeVisible();
  });

  test("logging out clears the identity, so the next visit is sent to login again", async ({
    page,
  }) => {
    await signInAs(page, E2E_USERS.rotated);
    await page.goto("/overview");
    await expect(page).toHaveURL(/\/overview/);

    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL(/__e2e_login_redirect__/);

    await page.goto("/tasks");
    await page.waitForURL(/__e2e_login_redirect__/);
  });
});
