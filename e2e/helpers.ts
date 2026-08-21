import { readFileSync } from "node:fs";
import path from "node:path";
import type { BrowserContext, Page } from "@playwright/test";
import { type E2EUser, signE2EAccessToken } from "./testAuth.js";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

/** Written by global-setup once the fixtures exist, with their real (DB-generated) ids. */
const usersFile = path.resolve(import.meta.dirname, ".e2e-users.json");
const fixtureUsers: E2EUser[] = JSON.parse(readFileSync(usersFile, "utf8")).users;

function fixture(username: `e2e.${string}`): E2EUser {
  const email = `${username}@stu.kau.edu.sa`;
  const user = fixtureUsers.find((u) => u.email === email);
  if (!user) throw new Error(`No E2E fixture for ${email} — did global setup run?`);
  return user;
}

/** Accounts provisioned by backend/scripts/e2e-fixtures.ts (global setup). */
export const E2E_USERS = {
  rotated: fixture("e2e.rotated"),
  fresh: fixture("e2e.fresh"),
  other: fixture("e2e.other"),
} as const;

/**
 * Signs the browser in as `user` without going near auth-service or a login
 * form: signs a test-key token for them and hands it to the browser as the
 * same cookie auth-service would have set. Accepts a Page or a BrowserContext
 * so a second, separately-signed-in actor in their own context works too.
 */
export async function signInAs(pageOrContext: Page | BrowserContext, user: E2EUser) {
  const context = "context" in pageOrContext ? pageOrContext.context() : pageOrContext;
  const token = await signE2EAccessToken(user);
  await context.addCookies([{ name: "access_token", value: token, url: BASE_URL }]);
}

export async function loginAsRotatedUser(page: Page) {
  await signInAs(page, E2E_USERS.rotated);
  await page.goto("/overview");
  await page.waitForURL("**/overview");
}

/** Signing in lands on the overview, so task specs navigate on from there. */
export async function loginAndOpenTasks(page: Page) {
  await loginAsRotatedUser(page);
  await page.goto("/tasks");
  await page.waitForURL("**/tasks");
}

/** Every section lives in the sidebar, which is a drawer below `lg`. */
export async function gotoSection(page: Page, name: string) {
  const menu = page.getByRole("button", { name: "Menu" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name, exact: true }).click();
}

/** Escapes an email (its dots especially) for safe use inside a locator RegExp. */
export function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
