# The KStacks Dashboard frontend. A plain Vite SPA with no SSR server — the
# build is a directory of static files, so the runtime stage is just a static
# file server, not Node running an app. (portal-frontend and groups-frontend
# are TanStack *Start* and build to .output/ with a real server entrypoint;
# this repo is the planner-frontend shape instead. Copying theirs would look
# for a .output/server/index.mjs that `vite build` never produces.)

# ---------- Stage 1: build ----------
FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# Manifests first, so a source-only change reuses the cached install layer.
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

# Vite bakes VITE_* into the client bundle at build time, so these are build
# args rather than runtime env — setting them on the container would do
# nothing, the values are already inlined in the shipped JS.
#
# Both default to empty, which is what a reverse-proxied deployment wants:
# an empty VITE_API_BASE_URL makes the app call /api on its own origin, and
# an empty login URL falls back to the production auth-service URL hardcoded
# in src/lib/authService.ts. Set the repository variables only when the
# frontend and the API are served from different origins.
ARG VITE_API_BASE_URL=""
ARG VITE_AUTH_SERVICE_LOGIN_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_AUTH_SERVICE_LOGIN_URL=$VITE_AUTH_SERVICE_LOGIN_URL

# paraglide compile -> tsc -b -> vite build. The i18n messages are generated
# into src/paraglide here rather than copied in, so the image never depends on
# codegen that only exists on a developer's machine — which is also why
# .dockerignore excludes that directory.
# `??` in src/lib/authService.ts falls back only on undefined, not on "" — so
# an empty VITE_AUTH_SERVICE_LOGIN_URL must reach vite as *unset* rather than
# as an empty string, or the production fallback URL is compiled away and the
# sign-in redirect resolves to nowhere. CI always passes the build arg (an
# unset repository variable expands to empty), so the guard belongs here.
RUN if [ -z "$VITE_AUTH_SERVICE_LOGIN_URL" ]; then unset VITE_AUTH_SERVICE_LOGIN_URL; fi; pnpm build

# ---------- Stage 2: runtime ----------
FROM node:24-alpine AS runner

# Non-root, with the uid/gid every other KStacks service image uses.
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

ENV NODE_ENV=production

# Installed as root, before the USER switch, so it lands in the global prefix.
RUN npm install -g serve

COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

USER appuser

EXPOSE 3000

# -s (--single) is required, not cosmetic: this is a client-side router, so
# every deep link like /tasks must be answered with index.html and resolved in
# the browser. Without it `serve` looks for a ./tasks file and 404s on reload.
CMD ["serve", "-s", "dist", "-l", "3000"]
