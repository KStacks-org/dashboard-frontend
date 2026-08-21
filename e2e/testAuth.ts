import { importJWK, SignJWT } from "jose";
import { TEST_ISSUER, TEST_KEY_ALG, TEST_KID, TEST_PRIVATE_JWK } from "./testAuthKey.js";

export type E2EUser = { id: string; email: string; displayName: string; flags?: string[] };

let privateKeyPromise: ReturnType<typeof importJWK> | null = null;

function privateKey() {
  privateKeyPromise ??= importJWK(TEST_PRIVATE_JWK, TEST_KEY_ALG);
  return privateKeyPromise;
}

/** Signs a token shaped like the ones auth-service issues, using the fixed E2E test key. */
export async function signE2EAccessToken(user: E2EUser): Promise<string> {
  const key = await privateKey();
  return new SignJWT({ name: user.displayName, email: user.email, flags: user.flags ?? [] })
    .setProtectedHeader({ alg: TEST_KEY_ALG, kid: TEST_KID })
    .setSubject(user.id)
    .setIssuer(TEST_ISSUER)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
}
