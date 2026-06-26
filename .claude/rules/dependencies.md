## Dependency Management

### Package manager

This repo uses **pnpm** exclusively. Never use npm or yarn.

### Where dependency commands run

Use **host `pnpm` from the repo root** for the whole monorepo. The root `Makefile` exposes `make install` as the standard wrapper for `pnpm install`.

### Installing dependencies

```bash
# Refresh all workspace dependencies / lockfile
make install

# Add to a specific workspace
pnpm --filter @nestled/webapp add react-hook-form
pnpm --filter @nestled/api add axios
pnpm --filter @nestled/mobileapp add -D @types/react

# Add tooling to the root (eslint, typescript, etc.)
pnpm add -D eslint -w
```

For Expo-managed mobile packages, prefer Expo's installer on the host:

```bash
cd apps/mobileapp && npx expo install <package>
```

After dependency changes, run `make install` from the repo root so `pnpm-lock.yaml` matches; restart the web dev server if it is running by stopping `make start` with `Ctrl+C` and running it again, or use `make restart` / `make refresh`.

### Common host commands

```bash
pnpm -r lint                          # lint all workspaces
pnpm -r format                        # check formatting in all workspaces
pnpm -r typecheck                     # type-check all workspaces
pnpm -r test                          # run workspace tests
pnpm --filter @nestled/webapp build   # one-off Next.js production build
pnpm --filter @nestled/mobileapp start # Expo dev server from repo root
```

The root `Makefile` wraps the common host commands (`make install`, `make start`, `make restart`, `make refresh`, `make clean`, `make lint`, `make typecheck`, `make test`, etc.).

### Build order

Apps depend on packages; bump or build packages before relying on new exports in apps. Follow each workspace's `package.json` scripts when a package has a build step.

Note: `@nestled/types` requires no build — it ships source directly.

### Environment variables

- Each app owns its own `.env.local` (not committed) and `.env.example` (committed) when env vars are introduced.
- Internal packages should avoid reading `process.env` directly for app-specific config — pass values from the app.

```ts
// ❌ Avoid in a reusable package
const url = process.env.NEXT_PUBLIC_API_URL

// ✅ Prefer configuration passed in
export function createApiClient(config: { baseUrl: string }) {
  /* … */
}
```
