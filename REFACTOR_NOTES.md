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
