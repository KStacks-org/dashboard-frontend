import type { Page } from "@playwright/test";

/** Accounts provisioned by backend/scripts/e2e-fixtures.ts (global setup). */
export const E2E_PASSWORD = "123456";

export const E2E_USERS = {
  /** Password already rotated — lands straight on the dashboard. */
  rotated: { email: "e2e.rotated@stu.kau.edu.sa", displayName: "اختبار مُفعَّل" },
  /** Still on the temporary password — must be forced through the change screen. */
  fresh: { email: "e2e.fresh@stu.kau.edu.sa", displayName: "اختبار جديد" },
  /** A second signed-in user, for creator-only permission checks. */
  other: { email: "e2e.other@stu.kau.edu.sa", displayName: "اختبار آخر" },
} as const;

export async function login(page: Page, email: string, password = E2E_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("University email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

export async function loginAsRotatedUser(page: Page) {
  await login(page, E2E_USERS.rotated.email);
  await page.waitForURL("**/overview");
}

/** Signing in lands on the overview, so task specs navigate on from there. */
export async function loginAndOpenTasks(page: Page) {
  await loginAsRotatedUser(page);
  await page.goto("/tasks");
  await page.waitForURL("**/tasks");
}

/** Escapes an email (its dots especially) for safe use inside a locator RegExp. */
export function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
