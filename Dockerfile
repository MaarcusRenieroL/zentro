# syntax=docker/dockerfile:1.7
#
# One Dockerfile for every Next.js app in the monorepo.
#   docker build --build-arg APP=web -t zentro-web .
#   docker build --target migrator -t zentro-migrator .
#
# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so
# pass the real public URLs as build args. Server secrets (BETTER_AUTH_SECRET,
# DATABASE_URL, RESEND_API_KEY) are only read at runtime; the placeholders
# below exist solely so `next build` can import the auth package.

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

# ---- deps: install with a cached store, keyed on the lockfile ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/authenticator/package.json apps/authenticator/package.json
COPY apps/docs/package.json apps/docs/package.json
COPY apps/tasks/package.json apps/tasks/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/utils/package.json packages/utils/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ---- migrator: runs drizzle migrations, then exits ----
FROM deps AS migrator
COPY packages/db packages/db
COPY packages/typescript-config packages/typescript-config
WORKDIR /repo/packages/db
CMD ["pnpm", "db:migrate"]

# ---- build ----
FROM deps AS build
ARG APP
ARG NEXT_PUBLIC_BASE_URL=http://localhost:3000
ARG NEXT_PUBLIC_AUTHENTICATOR_URL=http://localhost:3001
# Baked into next.config rewrites at build time.
ARG AUTHENTICATOR_INTERNAL_URL=http://authenticator:3001
ENV AUTHENTICATOR_INTERNAL_URL=$AUTHENTICATOR_INTERNAL_URL \
     NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_AUTHENTICATOR_URL=$NEXT_PUBLIC_AUTHENTICATOR_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    BETTER_AUTH_URL=http://build.invalid \
    BETTER_AUTH_SECRET=build-only-placeholder-not-used-at-runtime \
    DATABASE_URL=postgres://build:build@build.invalid:5432/build \
    RESEND_API_KEY=re_build_placeholder
COPY . .
RUN test -n "$APP" || (echo "Pass --build-arg APP=<web|tasks|docs|authenticator>" && exit 1)
RUN pnpm --filter "@zentro/${APP}" build

# ---- runtime: Next standalone output only ----
FROM node:22-alpine AS runner
ARG APP
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    APP=$APP
WORKDIR /repo
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /repo/apps/${APP}/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=build --chown=app:app /repo/apps/${APP}/public ./apps/${APP}/public
USER app
CMD node apps/${APP}/server.js
