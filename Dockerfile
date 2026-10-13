# syntax=docker/dockerfile:1.7
#
# Dockerfile for the Next.js app (apps/web) in the monorepo.
#   docker build -t zentro-web .
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
ARG NEXT_PUBLIC_BASE_URL=http://localhost:3000
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    BETTER_AUTH_URL=http://build.invalid \
    BETTER_AUTH_SECRET=build-only-placeholder-not-used-at-runtime \
    DATABASE_URL=postgres://build:build@build.invalid:5432/build \
    RESEND_API_KEY=re_build_placeholder
COPY . .
RUN pnpm --filter @zentro/web build

# ---- runtime: Next standalone output only ----
FROM node:22-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0
WORKDIR /repo
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=app:app /repo/apps/web/public ./apps/web/public
USER app
CMD node apps/web/server.js
