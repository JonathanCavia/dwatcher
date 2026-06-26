## Web App — apps/webapp

### Execution environment (agents)

- **Run the Next.js dev server on the host.** From the repo root: `make start` starts `@nestled/webapp` in the foreground (http://localhost:3000); stop it with `Ctrl+C` in the same terminal. Use `make restart` to reinstall first, or `make refresh` for a clean slate.
- **Use host `pnpm` for dependency changes and workspace quality gates.** The root `Makefile` wraps those host commands (`make lint`, `make typecheck`, `make test`, etc.) for convenience.
- For a **foreground** dev server with a full TTY: `pnpm --filter @nestled/webapp dev`.

### Stack

- Framework: **Next.js** (App Router)
- Package name: `@nestled/webapp`
- Location: `apps/webapp/`

### Router

Use the **App Router** (`app/` directory). Do not use the Pages Router for new work.

### Environment variables

- Public vars (accessible in browser): prefix with `NEXT_PUBLIC_`
- Server-only vars: no prefix, only used in Server Components or route handlers
- Store in `apps/webapp/.env.local` locally (not committed)
- Document all vars in `apps/webapp/.env.example` (committed, no real values)

### Internal package imports

```ts
import { … } from '@nestled/copy'
import type { … } from '@nestled/types'
import { … } from '@nestled/hooks'
import { … } from '@nestled/utils'
import { … } from '@nestled/api'
```

### Components (`src/components/`)

Web UI lives under **`apps/webapp/src/components/`**, grouped by feature (e.g. `welcome/`, `address/`).

- **`app/**/page.tsx`** — thin route entrypoints only; compose screen components, no heavy layout or business logic.
- Reuse existing pieces when adding screens (e.g. `PrimaryButtonLink`, `WelcomeStepRow`) before inventing new button/card markup.
- Co-locate feature-specific components in the same folder; promote to `src/components/ui/` only when reused across features.

### UI & layout

Web screens follow the **getnestled.app** visual language — centered, web-native layouts. Do not port the mobile app’s full-bleed phone-frame layout to the web unless a developer explicitly asks for that in chat.

#### References

| Purpose | Source |
| -------- | ------ |
| Layout, cards, CTA, spacing | [getnestled.app](https://getnestled.app) |
| Copy strings | `@nestled/copy` |
| Colors, radii, shadows, Tailwind tokens | `@nestled/theme` |

#### Default page structure

- **Hero (when needed):** full-width green band (`bg-nestled-green`), **no rounded corners**; inner content in `max-w-3xl`.
- **Main content:** centered elevated card — `max-w-[440px]`, `rounded-nestled-card-lg`, `shadow-nestled-card-lg`, `border border-nestled-border`, white background on cream page background.
- **Primary CTA:** full-width green link/button (`PrimaryButtonLink` pattern) — `rounded-xl`, `hover:bg-nestled-green-mid`, `active:scale-[0.98]`.
- **Copy:** from `@nestled/copy`, not hard-coded in components.

Reference implementation: `app/page.tsx` + `src/components/welcome/`. New and redesigned screens (including address and later onboarding steps) should align with this pattern over time.

#### Tailwind

`tailwind.config.ts` **must** scan both route and component trees:

```ts
content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx}']
```

Classes defined only under `src/components/` will not compile if `src/` is omitted.

### Web-only features

The following features belong in `apps/webapp` (not in shared packages as web-specific UI):

- Desktop-optimized layouts and workflows
- Web-only admin or billing surfaces when they assume DOM/browser APIs

### Building

Production build (often run in CI or locally on the host with the same `pnpm` the team uses):

```bash
make start                                                         # foreground dev server (Ctrl+C to stop)
pnpm --filter @nestled/webapp build                                # one-off web production build
```

After dependency changes, run `make install` (or `pnpm install`) from the repo root, then restart dev by stopping `make start` with `Ctrl+C` and running it again, or use `make restart` / `make refresh`.
