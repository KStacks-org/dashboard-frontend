/**
 * A fixed ES256 key pair used only to sign/verify tokens for E2E runs.
 * Generated once and hardcoded rather than created fresh per run: the mock
 * JWKS server (started in global-setup) and the spec files that sign tokens
 * (running in separate worker processes) need to agree on the same key
 * without any way to hand a freshly-generated one between processes.
 *
 * Not a secret in any real sense — it never signs anything auth-service (or
 * anyone else) trusts outside this test run's own mock JWKS endpoint.
 */
export const TEST_ISSUER = "e2e-test-issuer";
export const TEST_KEY_ALG = "ES256";
export const TEST_KID = "e2e-test-key";

export const TEST_PRIVATE_JWK = {
  kty: "EC",
  crv: "P-256",
  x: "EuB6pQIIgDoJTWghfwG3_hPYcQTvrdKw7UeAgQJDCvQ",
  y: "5ZadOv6W2xfd17WXLwO0iyHoS4aoFoSh8xdNPayAPzA",
  d: "tlpxs7FR-lo690-k8u11XbYwxO16H5g8bAD6euneWk8",
  kid: TEST_KID,
  alg: TEST_KEY_ALG,
} as const;

export const TEST_PUBLIC_JWK = {
  kty: "EC",
  crv: "P-256",
  x: "EuB6pQIIgDoJTWghfwG3_hPYcQTvrdKw7UeAgQJDCvQ",
  y: "5ZadOv6W2xfd17WXLwO0iyHoS4aoFoSh8xdNPayAPzA",
  kid: TEST_KID,
  alg: TEST_KEY_ALG,
  use: "sig",
} as const;
