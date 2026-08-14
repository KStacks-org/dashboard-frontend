import type { Page } from "@playwright/test";

/** Accounts provisioned by backend/scripts/e2e-fixtures.ts (global setup). */
export const E2E_PASSWORD = "123456";

export const E2E_USERS = {
  /** Password already rotated — lands straight on the dashboard. */
  rotated: { username: "e2e.rotated", displayName: "اختبار مُفعَّل" },
  /** Still on the temporary password — must be forced through the change screen. */
  fresh: { username: "e2e.fresh", displayName: "اختبار جديد" },
  /** A second signed-in user, for creator-only permission checks. */
  other: { username: "e2e.other", displayName: "اختبار آخر" },
} as const;

export async function login(page: Page, username: string, password = E2E_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

export async function loginAsRotatedUser(page: Page) {
  await login(page, E2E_USERS.rotated.username);
  await page.waitForURL("**/tasks");
}
