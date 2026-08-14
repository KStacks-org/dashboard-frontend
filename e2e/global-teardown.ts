import { execFileSync } from "node:child_process";
import path from "node:path";

const backendDir = path.resolve(import.meta.dirname, "../../backend");

export default function globalTeardown() {
  execFileSync("pnpm", ["exec", "tsx", "scripts/e2e-fixtures.ts", "teardown"], {
    cwd: backendDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}
