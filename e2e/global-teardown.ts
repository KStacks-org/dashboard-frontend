import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { usersFile } from "./global-setup.js";

const backendDir = path.resolve(import.meta.dirname, "../../backend");

export default function globalTeardown() {
  execFileSync("pnpm", ["exec", "tsx", "scripts/e2e-fixtures.ts", "teardown"], {
    cwd: backendDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  rmSync(usersFile, { force: true });
}
