/**
 * Where the browser is sent to sign in — auth-service's own login endpoint,
 * a full-page redirect (Google OAuth cannot happen inside a fetch). Defaults
 * to the real production URL, so nothing needs configuring for the common
 * case; override only when pointing local/staging at a different instance.
 */
export const AUTH_SERVICE_LOGIN_URL =
  import.meta.env.VITE_AUTH_SERVICE_LOGIN_URL ?? "https://api.kstacks.org/auth/login";

export function redirectToAuthServiceLogin(): void {
  window.location.href = AUTH_SERVICE_LOGIN_URL;
}
