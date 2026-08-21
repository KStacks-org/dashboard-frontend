import { defineConfig, devices } from "@playwright/test";
import { JWKS_URL } from "./e2e/jwksServer.ts";
import { TEST_ISSUER } from "./e2e/testAuthKey.ts";

const FRONTEND_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : [["list"]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: FRONTEND_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Runs `pnpm dev` (backend + frontend together) from the repo root — cwd
  // must be set explicitly because it otherwise defaults to this config
  // file's own directory, where `pnpm dev` silently resolves to *frontend's*
  // own "dev" script (frontend-only, no backend) instead of the root one.
  // reuseExistingServer means an already-running `pnpm dev` is left alone —
  // note that instance keeps whichever auth-service config it already booted
  // with, so sign-in via helpers.ts's signInAs will not authenticate against
  // it unless it was itself started with the same AUTH_SERVICE_JWKS_URL.
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: "pnpm dev",
        cwd: "..",
        url: FRONTEND_URL,
        reuseExistingServer: true,
        timeout: 60_000,
        env: {
          AUTH_SERVICE_JWKS_URL: JWKS_URL,
          AUTH_SERVICE_JWT_ISSUER: TEST_ISSUER,
          // A same-origin stub path rather than the real auth-service login —
          // specs just assert the browser was sent here, without an actual
          // navigation to the open internet.
          VITE_AUTH_SERVICE_LOGIN_URL: `${FRONTEND_URL}/__e2e_login_redirect__`,
        },
      },
});
