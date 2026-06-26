## Monorepo Structure & Package Responsibilities

### Workspace layout

```
nestled-frontend/
├── packages/
│   ├── copy/      → @nestled/copy
│   ├── types/     → @nestled/types
│   ├── hooks/     → @nestled/hooks
│   ├── utils/     → @nestled/utils
│   ├── api/       → @nestled/api
│   └── theme/     → @nestled/theme
└── apps/
    ├── webapp/    → @nestled/webapp   (Next.js, App Router)
    └── mobileapp/ → @nestled/mobileapp (React Native + Expo)
```

### Package responsibilities

- `@nestled/copy` — shared labels, text content, and copy-only data. No UI components.
- `@nestled/types` — shared TypeScript types and interfaces only. No runtime logic. No executable code.
- `@nestled/hooks` — React hooks, Zustand stores, and small shared client patterns used by apps.
- `@nestled/utils` — pure utility functions and small platform-neutral view-model shaping.
- `@nestled/api` — API client and TanStack Query hooks for backend calls.
- `@nestled/theme` — shared design tokens, CSS variables, and Tailwind bridge.
- `apps/*` — final applications. Never imported by other packages or apps.
- `packages/*` — reusable internal libraries. Avoid app-specific UI here.

### Shared store API design (`@nestled/hooks`)

When a shared Zustand store represents a small multi-field draft or handoff object, prefer exposing:

- one **combined setter** for the common atomic success path (for example, setting `selectedSuggestion` + `addressDetails` together after a successful lookup), and
- **separate setters / clear helpers** for each sub-state field when callers may update only one part later.

Example pattern:

- `setOnboardingAddressSelection(...)` for the atomic handoff
- `setSelectedSuggestion(...)`, `setAddressDetails(...)` for convenience updates
- `clearSelectedSuggestion()`, `clearAddressDetails()`, plus a full `clearOnboardingAddressSelection()` reset helper

Do not rely on passing `undefined` for omitted fields in a combined setter as a way to "leave the old value alone". In Zustand, update only the keys you intentionally want to change.

### Naming

- All internal packages use the `@nestled/` scope.
- New packages go in `packages/`, new apps go in `apps/`.
- Package name must match its directory: `packages/foo` → `@nestled/foo`.

### Referencing internal packages

Always use `workspace:*` — never pin versions between internal packages:

```json
{
  "dependencies": {
    "@nestled/types": "workspace:*",
    "@nestled/api": "workspace:*"
  }
}
```

### New package checklist

When creating a new package under `packages/`:

1. Add `package.json` with `"name": "@nestled/<name>"` and `"private": true`
2. Add `tsconfig.json` extending the repo base config
3. Create `src/index.ts` as the primary entry point
4. Add scripts your package needs (`build`, `lint`, `typecheck`, `test`, etc.)
5. Run `make install` from the repo root on the host to refresh the workspace lockfile; restart the web dev server if it is running so it picks up the new graph
