import { createServer } from "node:http";
import { TEST_PUBLIC_JWK } from "./testAuthKey.js";

/**
 * Fixed on purpose: playwright.config.ts's webServer.env points the real
 * backend at this exact URL, and that env block is static — it has to know
 * the port before this server (or the backend) ever starts.
 */
export const JWKS_PORT = 4198;
export const JWKS_URL = `http://127.0.0.1:${JWKS_PORT}/jwks.json`;

/**
 * Stands in for auth-service's JWKS endpoint during E2E runs, so the backend
 * can verify tokens signed with the fixed test key instead of needing a real
 * auth-service to talk to. Started once from global-setup and left running
 * for the whole test run — it dies with the `playwright test` process.
 */
export function startTestJwksServer(): Promise<void> {
  const server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ keys: [TEST_PUBLIC_JWK] }));
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(JWKS_PORT, "127.0.0.1", () => resolve());
  });
}
