import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { startTestJwksServer } from "./jwksServer.js";

const backendDir = path.resolve(import.meta.dirname, "../../backend");
export const usersFile = path.resolve(import.meta.dirname, ".e2e-users.json");

export default async function globalSetup() {
  // Must be listening before playwright.config.ts's webServer spawns the
  // backend — that's where AUTH_SERVICE_JWKS_URL gets pointed at it.
  await startTestJwksServer();

  // stdout carries the fixtures' real ids as JSON (stderr passes through for
  // visibility) — sign-in now needs a token bound to a real roster id, not
  // just an email/password pair a login form can type in.
  const output = execFileSync("pnpm", ["exec", "tsx", "scripts/e2e-fixtures.ts", "setup"], {
    cwd: backendDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    shell: process.platform === "win32",
  });
  writeFileSync(usersFile, output.trim());
}
