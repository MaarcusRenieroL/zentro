# Refactor notes

## Step 0a: Baseline (before any fix)

Work is done directly on `main` (user decision), after committing the pending docker/next-config changes.

| Check                                                      | Result           |
| ---------------------------------------------------------- | ---------------- |
| `pnpm turbo run check-types` (all 11 packages)             | PASS             |
| `pnpm turbo run lint` (all apps)                           | PASS             |
| `pnpm turbo run build` with a bare shell env               | FAIL, all 4 apps |
| `pnpm turbo run build` with `.env.example` values exported | PASS, all 4 apps |

Build failure without env: `Error: Missing required environment variable: RESEND_API_KEY`
(`Failed to collect page data for /api/trpc/[trpc]`). The root `.env` is not read by the
per-app `next build`, so builds need the variables exported in the shell. Not a code bug.
Build command used from here on: `set -a; . ./.env.example; set +a; AUTHENTICATOR_INTERNAL_URL=http://localhost:3001 pnpm turbo run build`.

## Found while merging

- `packages/auth/src/index.ts` still lists `http://*.localhost:3003` and `http://*.docs.localhost:3003` as trusted origins. Left alone on purpose (Better Auth config is out of scope for step 1); remove once the auth step happens.
- `packages/utils/src/app-url.ts` still has `docs` in `ZentroApp`, `localAppPorts` (3003) and `isOrgApp`. Nothing in web uses it any more; clean up together with the tasks move.
- `WorkspaceSidebarApp` in `packages/ui/src/components/workspace-sidebar.tsx` still allows `"docs"`; unused now.
- Build from a bare shell fails (see Step 0a). The root `.env` is not loaded by `next build` in each app, so builds need the vars exported.
- `.env` points `DATABASE_URL` at `user:password@localhost:5432/zentro`, but the Postgres on 5432 here belongs to another project (`life-os-postgres-1`) and has no such role. Local verification used a throwaway container on port 5433.
- The doc editor redirected to `/docs` after "Move to trash", which was a 404 in the old docs app (no `/docs` route). It now lands on the new `/docs` index.
- `next build` / `next dev` rewrite `apps/*/next-env.d.ts` (tracked for docs/tasks) on every run; not committed.
- Slug reservation: `createDocSchema` now rejects `my-docs, projects, recent, search, trash, new`. The UI already always appends a base-36 timestamp, so it could never produce them; the check closes the direct API path. Existing rows with those slugs, if any, were not checked.
- Doc editor "Move to trash" / comments panel behave as before; the comments panel opens over the content at ~1024px viewport width (pre-existing layout, not changed).
- Docs mutation procedures still use the same `authorizedProcedure` checks; after Step 0b they now resolve the role from the caller's own membership.
