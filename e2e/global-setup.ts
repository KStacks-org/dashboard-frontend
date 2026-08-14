import { execFileSync } from "node:child_process";
import path from "node:path";

const backendDir = path.resolve(import.meta.dirname, "../../backend");

export default function globalSetup() {
  execFileSync("pnpm", ["exec", "tsx", "scripts/e2e-fixtures.ts", "setup"], {
    cwd: backendDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}
