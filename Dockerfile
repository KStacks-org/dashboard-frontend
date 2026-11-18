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

ARG BUILD_MODE=prod
RUN pnpm build --mode "$BUILD_MODE"

# ---------- Stage 2: runtime ----------
# Nothing of the build survives into this stage except dist/ — no sources, no
# node_modules, no lockfile, and no .env (which .dockerignore keeps out of the
# context entirely, so a developer's local values can never reach a build).
FROM node:24-alpine AS runner

# Non-root, with the uid/gid every other KStacks service image uses.
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Installed as root, before the USER switch, so it lands in the global prefix.
# Pinned because this is the only thing the runtime stage installs and an
# unpinned `latest` makes an otherwise reproducible image drift between builds.
RUN npm install -g serve@14.2.6 && npm cache clean --force

COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

USER appuser

EXPOSE 3000

# Static files only — there is no backend call here, so this reports on the
# file server itself and never fails because the API is down.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# -s (--single) is required, not cosmetic: this is a client-side router, so
# every deep link like /tasks must be answered with index.html and resolved in
# the browser. Without it `serve` looks for a ./tasks file and 404s on reload.
CMD ["serve", "-s", "dist", "-l", "3000"]
