# Plan: Restructure dwatcher Mobile App Skeleton (nestled-frontend patterns)

> **Reference & Iterate**: This plan is the source of truth for the mobile skeleton restructure. It must be referenced before any implementation work on `apps/mobile/`. Update it as stages are completed, deviations are discovered, or requirements change. Plans in `docs/plans/` are living documents — commit early and iterate often.

## Context

The dwatcher mobile app at `apps/mobile/` is a Phase 0 scaffold with a single `HomeScreen`, minimal `_layout.tsx`, hardcoded inline styles, and no theme system, state management, API client, testing setup, or component hierarchy. The nestled-frontend at `apps/mobileapp/` is a mature Expo app with a replicable structure: thin route files, `app/screens/` for screen implementations, ScreenShell wrapper, theme package (colors, spacing, typography, shadows), Zustand + TanStack Query, `src/components/` organized by domain, and `jest-expo` testing.

**Goal**: Delete the current mobile app implementation (preserving config skeleton), then replicate nestled-frontend's base structure. The result is a working, clean skeleton app that opens via QR scan immediately — "funcional aunque no tenga nada."

**Non-goals**: No domain functionality (no monitoring, no audio, no ML, no WebRTC, no camera, no backend integration). No data package creation (types already exist). No Google Fonts (using system fonts). Theme is app-local (not extracted to a package). Just the structural skeleton.

---

## Plan Stages

### Stage 1 | Strip current mobile app implementation to skeleton

Delete all source files under `apps/mobile/src/` and the existing route files in `apps/mobile/app/` (except `_layout.tsx` which will be rewritten in Stage 7). Remove the `src/` directory entirely.

Files to delete:
- `apps/mobile/src/` (entire directory — recursive delete)
- `apps/mobile/app/index.tsx` (will be replaced in Stage 6)
- `apps/mobile/app/_layout.tsx` (will be rewritten in Stage 7)

Files to keep untouched (config skeleton):
- `apps/mobile/app.json`
- `apps/mobile/.env.example`
- `apps/mobile/babel.config.js`
- `apps/mobile/metro.config.js`
- `apps/mobile/package.json` (will be updated in Stage 2)
- `apps/mobile/tsconfig.json`
- `apps/mobile/assets/` (placeholder icons remain)

* Scope: mobileapp
* Commit: `chore(mobile): strip current implementation — delete src/ and route files`
* Files to touch: `apps/mobile/src/` (recursive delete), `apps/mobile/app/index.tsx` (delete), `apps/mobile/app/_layout.tsx` (delete then recreate in Stage 7)
* Dependencies: none
* Test strategy: `pnpm --filter @dwatcher/mobile typecheck` passes (no source to typecheck); `pnpm --filter @dwatcher/mobile start` shows Expo dev server with a blank route tree

---

### Stage 2 | Update package.json — add Zustand, TanStack Query, jest, icons, gesture-handler

Add the following dependencies to `apps/mobile/package.json` (mirroring nestled-frontend's `@nestled/mobileapp` for the structural skeleton — domain deps like camera, notifications, etc. are NOT added):

**dependencies to add**:
- `@tanstack/react-query@^5.32.0` — data fetching
- `zustand@^4.4.0` — state management
- `@expo/vector-icons@^15.1.1` — icon library (used in ScreenShell side menu and brand title)
- `react-native-gesture-handler@~2.28.0` — required by SafeAreaProvider / gesture-aware navigation

**devDependencies to add**:
- `@testing-library/react-native@^12.4.0` — React Native testing
- `@types/jest@^29.5.0` — Jest type definitions
- `jest@^29.7.0` — test runner
- `jest-expo@~54.0.17` — Expo Jest preset

Add the following npm script:
- `"test": "jest"` — test runner

Also create:
- `apps/mobile/jest.config.js` — Jest configuration with `jest-expo` preset, moduleNameMapper for `@dwatcher/*` packages, and the setup file
- `apps/mobile/jest.setup.js` — mocks for `expo-router`, `react-native-safe-area-context`, `expo-status-bar`, and `@expo/vector-icons`

**jest.config.js**:
```js
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '@dwatcher/(.+)': '<rootDir>/../../packages/$1/src',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
}
```

**jest.setup.js**: Mock `expo-router` (Stack, useRouter, useLocalSearchParams, useFocusEffect), `react-native-safe-area-context` (useSafeAreaInsets with static values), `expo-status-bar` (StatusBar returns null), and `@expo/vector-icons` (returns Text elements with the icon name).

* Scope: mobileapp
* Commit: `feat(mobile): add Zustand, TanStack Query, jest setup, vector-icons, gesture-handler deps`
* Files to touch: `apps/mobile/package.json`, `apps/mobile/jest.config.js`, `apps/mobile/jest.setup.js`
* Dependencies: Stage 1 (clean slate)
* Test strategy: `pnpm install` from repo root succeeds; `pnpm --filter @dwatcher/mobile test` runs jest (0 tests = passes with no test files yet)

---

### Stage 3 | Create app theme system

Create `apps/mobile/src/theme/` with dwatcher brand colors, spacing, radii, shadows, and typography tokens. This mirrors nestled's `apps/mobileapp/src/theme/index.ts` pattern but uses dwatcher's dark theme identity (`#1a1a2e` background, `#e94560` accent red).

Files to create:

**apps/mobile/src/theme/dwatcher-palette.ts** — Dark theme color tokens:
- `background`, `background-mid`, `background-light`, `surface` — dark base
- `accent`, `accent-light`, `accent-pale` — primary brand red
- `text`, `text-mid`, `text-soft`, `text-inverse` — text hierarchy
- `success`, `warning`, `error`, `info` — semantic colors
- `border`, `border-light`, `white` — neutrals
- Export `dwatcherPalette` const and `DwatcherPaletteKey` type

**apps/mobile/src/theme/dwatcher-spacing.ts** — Layout spacing:
- `screenContent` (paddingHorizontal: 20, paddingTop: 22, paddingBottom: 24)
- `welcomeHero` (paddingTop: 36, paddingHorizontal: 24, paddingBottom: 28)

**apps/mobile/src/theme/dwatcher-radii.ts** — Border radii:
- `button: 12`, `card: 12`, `cardLg: 20`

**apps/mobile/src/theme/dwatcher-shadows.ts** — Platform-selective shadow config:
- iOS: `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`
- Android: `elevation`

**apps/mobile/src/theme/dwatcher-typography.ts** — Font sizes and line heights:
- `heroTitle: 42`, `heroSubtitle: 18`, `bodyIntro: 15`, `button: 16`, etc.

**apps/mobile/src/theme/index.ts** — Barrel export:
- Re-exports all token modules
- Exports `colors = dwatcherPalette` as a convenience alias
- Exports `paletteColor(key)` helper function
- Exports empty `textStyles` and `layoutStyles` objects (for future population — ensures import paths exist)

* Scope: mobileapp
* Commit: `feat(mobile): create app theme system with dwatcher palette, spacing, radii, shadows, typography`
* Files to touch:
  - `apps/mobile/src/theme/index.ts`
  - `apps/mobile/src/theme/dwatcher-palette.ts`
  - `apps/mobile/src/theme/dwatcher-spacing.ts`
  - `apps/mobile/src/theme/dwatcher-radii.ts`
  - `apps/mobile/src/theme/dwatcher-shadows.ts`
  - `apps/mobile/src/theme/dwatcher-typography.ts`
* Dependencies: Stage 1, Stage 2
* Test strategy: `pnpm --filter @dwatcher/mobile typecheck` passes

---

### Stage 4 | Create ScreenShell layout component

Create `apps/mobile/src/components/layout/ScreenShell.tsx` — a wrapper component that provides SafeAreaView, StatusBar, and an optional header with brand title, back button, and menu button. Modeled after nestled's `ScreenShell` but adapted for dwatcher's dark theme.

**ScreenShell.tsx**:
- Props: `children`, `header?`, `headerBackgroundColor?` (default `colors.background`), `hideBrandTitle?`, `statusBarStyle?` (default `'light'`), `style?`, `showMenuButton?` (default `false`), `onBack?`
- Renders `StatusBar` with `statusBarStyle`
- If `header` provided: wraps in `SafeAreaView` with `edges={['top']}` and the header background
  - If header exists and not hidden: renders top row with optional back button, `ScreenBrandTitle`, optional menu button
  - Renders the header content below
- Renders `{children}` below the header section
- Renders `SideMenuOverlay` (from Stage 5)

Also create:

**apps/mobile/src/components/layout/ScreenBrandTitle.tsx** — Centered "dwatcher" wordmark text (white, bold, uppercase).

**apps/mobile/src/utils/safeArea.ts** — `getScreenContentPadding(insets, basePaddingBottom?)` helper that returns `{ paddingBottom }` incorporating the safe area bottom inset.

* Scope: mobileapp
* Commit: `feat(mobile): create ScreenShell layout component, ScreenBrandTitle, and safe area utils`
* Files to touch:
  - `apps/mobile/src/components/layout/ScreenShell.tsx`
  - `apps/mobile/src/components/layout/ScreenBrandTitle.tsx`
  - `apps/mobile/src/utils/safeArea.ts`
* Dependencies: Stage 3 (needs theme tokens)
* Test strategy: `pnpm --filter @dwatcher/mobile typecheck` passes

---

### Stage 5 | Create SideMenuOverlay and UI primitives

Create `apps/mobile/src/components/ui/SideMenuOverlay.tsx` — animated side menu panel (slides in from right via Modal + Animated.View), modeled after nestled's `SideMenuOverlay`.

Simplified menu items for dwatcher skeleton:
```ts
const MENU_ITEMS = [
  { id: 'settings', emoji: '⚙️', label: 'Settings', route: null },
]
```
Route is `null` to indicate "not implemented yet" — the item renders but does nothing on press. This is intentional: no auth/household routes exist yet.

Also create two UI primitive components:

**apps/mobile/src/components/ui/PrimaryButton.tsx** — Full-width action button:
- Props: `label`, `onPress`, `disabled?`, `loading?`
- Background: `colors.accent` (disabled: `colors['background-mid']`)
- Text: `colors.white`, bold, centered
- Border radius: `dwatcherRadii.button`

**apps/mobile/src/components/ui/GhostButton.tsx** — Text-only button:
- Props: `label`, `onPress`, `disabled?`
- Text: `colors['text-soft']`, medium weight, centered
- No background, minimal vertical padding

* Scope: mobileapp
* Commit: `feat(mobile): create SideMenuOverlay, PrimaryButton, and GhostButton UI components`
* Files to touch:
  - `apps/mobile/src/components/ui/SideMenuOverlay.tsx`
  - `apps/mobile/src/components/ui/PrimaryButton.tsx`
  - `apps/mobile/src/components/ui/GhostButton.tsx`
* Dependencies: Stage 3 (needs theme), Stage 4 (ScreenShell imports SideMenuOverlay)
* Test strategy: `pnpm --filter @dwatcher/mobile typecheck` passes

---

### Stage 6 | Create placeholder HomeScreen in app/screens/

Create the screen directory at `apps/mobile/app/screens/` (mirroring nestled's pattern of screens under `app/`, NOT `src/screens/`).

**apps/mobile/app/screens/HomeScreen.tsx** — Minimal placeholder screen that shows the dwatcher brand and structural components working. No monitoring logic — just static UI using ScreenShell, PrimaryButton, and GhostButton.

The screen uses ScreenShell with a dark header, displays title "dwatcher", subtitle "Dog Watcher", description text, a disabled PrimaryButton (label "Start Monitoring", onPress does nothing), and a GhostButton (label "Settings", onPress does nothing). Styles are defined as inline `StyleSheet.create` for this screen's local layout.

**apps/mobile/app/index.tsx** — Thin route file:
```tsx
export { HomeScreen as default } from './screens/HomeScreen'
```

* Scope: mobileapp
* Commit: `feat(mobile): create placeholder HomeScreen in app/screens/ with thin route file`
* Files to touch:
  - `apps/mobile/app/index.tsx` (rewrite)
  - `apps/mobile/app/screens/HomeScreen.tsx` (new)
* Dependencies: Stage 4, Stage 5 (uses ScreenShell, PrimaryButton, GhostButton)
* Test strategy: `pnpm --filter @dwatcher/mobile typecheck` passes; `pnpm --filter @dwatcher/mobile start` serves a working app with the HomeScreen visible via QR scan

---

### Stage 7 | Update RootLayout with screen registrations, theme, and gesture handler

Rewrite `apps/mobile/app/_layout.tsx` to match nestled's pattern:
- Import `react-native-gesture-handler` at the top (convention for gesture-aware navigation)
- Import theme's `colors` for the content background
- Register all screens in the Stack navigator explicitly (currently just `index`)
- Keep `SafeAreaProvider` wrapping and `StatusBar`

```tsx
import 'react-native-gesture-handler'

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { colors } from '../src/theme'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  )
}
```

* Scope: mobileapp
* Commit: `refactor(mobile): update RootLayout to register screens, use theme tokens, and import gesture handler`
* Files to touch: `apps/mobile/app/_layout.tsx` (rewrite)
* Dependencies: Stage 3 (needs colors import), Stage 2 (needs react-native-gesture-handler)
* Test strategy: App renders without gesture handler errors; `pnpm --filter @dwatcher/mobile typecheck` passes

---

### Stage 8 | Add LoadingState and ErrorBoundary

Create two infrastructure components:

**apps/mobile/src/components/ui/LoadingState.tsx** — Centered `ActivityIndicator` with an optional message:
```tsx
export function LoadingState({ message = 'Loading...', color }: { message?: string; color?: string })
```
Uses `colors['text-soft']` as default spinner color, white text for the message, `colors.background` as the container background. Exports `LoadingState` as named export.

**apps/mobile/src/components/ErrorBoundary.tsx** — React class component error boundary:
```tsx
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState>
```
Catches render errors and shows a fallback UI with "Something went wrong" text, the error message (in `__DEV__` only), and a "Try Again" button that calls `setState({ hasError: false })`. In `__DEV__`, logs the error and component stack via `console.error('[ErrorBoundary]', ...)`.

* Scope: mobileapp
* Commit: `feat(mobile): add LoadingState component and ErrorBoundary with dev logging`
* Files to touch:
  - `apps/mobile/src/components/ui/LoadingState.tsx`
  - `apps/mobile/src/components/ErrorBoundary.tsx`
* Dependencies: Stage 3 (needs theme tokens)
* Test strategy: `pnpm --filter @dwatcher/mobile typecheck` passes

---

### Stage 9 | Scaffold empty Zustand stores

Create `apps/mobile/src/stores/` with empty Zustand store skeletons matching the store structure planned in `docs/ARCHITECTURE.md`. These are just type interfaces with no methods — they exist so future code has import paths ready and the dependency is exercised.

**apps/mobile/src/stores/session-store.ts**:
```ts
import { create } from 'zustand'

interface SessionStore {}
export const useSessionStore = create<SessionStore>(() => ({}))
```

**apps/mobile/src/stores/event-store.ts**:
```ts
import { create } from 'zustand'

interface EventStore {}
export const useEventStore = create<EventStore>(() => ({}))
```

**apps/mobile/src/stores/settings-store.ts**:
```ts
import { create } from 'zustand'

interface SettingsStore {}
export const useSettingsStore = create<SettingsStore>(() => ({}))
```

**apps/mobile/src/stores/index.ts** — Barrel re-export:
```ts
export { useSessionStore } from './session-store'
export { useEventStore } from './event-store'
export { useSettingsStore } from './settings-store'
```

* Scope: mobileapp
* Commit: `chore(mobile): scaffold empty Zustand stores for session, event, and settings`
* Files to touch:
  - `apps/mobile/src/stores/session-store.ts`
  - `apps/mobile/src/stores/event-store.ts`
  - `apps/mobile/src/stores/settings-store.ts`
  - `apps/mobile/src/stores/index.ts`
* Dependencies: Stage 2 (needs `zustand` dependency installed)
* Test strategy: `pnpm --filter @dwatcher/mobile typecheck` passes; stores import and create without errors

---

### Stage 10 | Create TanStack Query client provider

Create `apps/mobile/src/services/query-client.ts` — a singleton `QueryClient` with default options and a helper that provides a consistent instance.

```ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
```

Default options:
- `queries.retry: 2`
- `queries.staleTime: 5 * 60 * 1000` (5 minutes)
- `queries.gcTime: 30 * 60 * 1000` (30 minutes)

Expose `getQueryClient()` (lazy singleton) and `createQueryClient()` (factory).

Update `apps/mobile/app/_layout.tsx` to wrap the Stack in `QueryClientProvider`:
```tsx
import { QueryClientProvider, getQueryClient } from '../src/services/query-client'

const queryClient = getQueryClient()

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        {/* ... existing content ... */}
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
```

* Scope: mobileapp
* Commit: `feat(mobile): create TanStack Query client provider and wrap root layout`
* Files to touch:
  - `apps/mobile/src/services/query-client.ts` (new)
  - `apps/mobile/app/_layout.tsx` (update to wrap in QueryClientProvider)
* Dependencies: Stage 2 (needs @tanstack/react-query), Stage 7 (needs RootLayout)
* Test strategy: `pnpm --filter @dwatcher/mobile typecheck` passes; app renders without hydration errors

---

### Stage 11 | Add HomeScreen render test

Create `apps/mobile/__tests__/HomeScreen.test.tsx` — a simple render test that verifies the HomeScreen renders with the correct title text and key structural elements.

```tsx
import { render, screen } from '@testing-library/react-native'
import { HomeScreen } from '../app/screens/HomeScreen'

// Mock ScreenShell and button components to avoid full dependency tree
jest.mock('../src/components/layout/ScreenShell', () => ({
  ScreenShell: ({ children }: { children: React.ReactNode }) => {
    const React = require('react')
    const { View } = require('react-native')
    return React.createElement(View, null, children)
  },
  useScreenShellInsets: () => ({ insets: { top: 0, right: 0, bottom: 0, left: 0 } }),
}))

jest.mock('../src/components/ui/PrimaryButton', () => ({
  PrimaryButton: () => null,
}))

jest.mock('../src/components/ui/GhostButton', () => ({
  GhostButton: () => null,
}))

describe('HomeScreen', () => {
  it('renders the app title', () => {
    render(<HomeScreen />)
    expect(screen.getByText('dwatcher')).toBeTruthy()
  })

  it('renders the subtitle', () => {
    render(<HomeScreen />)
    expect(screen.getByText('Dog Watcher')).toBeTruthy()
  })
})
```

* Scope: mobileapp
* Commit: `test(mobile): add HomeScreen render test for title and subtitle`
* Files to touch:
  - `apps/mobile/__tests__/HomeScreen.test.tsx`
* Dependencies: Stage 6 (needs HomeScreen implementation), Stage 2 (needs jest setup)
* Test strategy: `pnpm --filter @dwatcher/mobile test` passes (2/2 tests)

---

### Stage 12 | Refresh lockfile and verify

Run `pnpm install` from repo root to update `pnpm-lock.yaml` with all new dependencies.

Verification checklist:
- [ ] `pnpm install` exits 0 and lockfile is consistent
- [ ] `pnpm --filter @dwatcher/mobile typecheck` passes
- [ ] `pnpm --filter @dwatcher/mobile test` passes (2/2 tests)
- [ ] `pnpm --filter @dwatcher/mobile start` — Expo dev server starts on localhost:8081, QR is generated
- [ ] `pnpm -r typecheck` passes (no regressions in other workspaces)

* Scope: repo
* Commit: `chore(repo): refresh lockfile after mobile skeleton restructure`
* Files to touch: `pnpm-lock.yaml` (auto-updated by pnpm install)
* Dependencies: All previous stages
* Test strategy: Lockfile is consistent; full workspace typecheck and lint pass

---

## Trade-offs

| Decision | Alternative Considered | Reason |
|----------|------------------------|--------|
| Screens in `app/screens/` (not `src/screens/`) | dwatcher ARCHITECTURE.md planned `src/screens/` | Matching nestled's proven pattern where screens co-locate with routes under `app/`. The `app/` directory is for Expo Router concerns; having screens there reduces indirection. |
| Theme as app-local files (not a package) | Extract `@dwatcher/theme` like `@nestled/theme` | dwatcher already has 4 packages. Theme is only consumed by the mobile app. If the backend ever needs theme tokens, promote it later. YAGNI. |
| No Google Fonts | nestled uses `@expo-google-fonts/*` (DM Sans + Playfair Display) | dwatcher is Android-first with a dark theme. System fonts (Roboto) are fine for the skeleton. Adding font loading is a trivial future step with no structural impact. |
| Simplified SideMenuOverlay (one placeholder item) | nestled has household, settings, and dev-login entries | dwatcher has no auth, no household concept yet. Placeholder items with `route: null` signal "not implemented" without breaking anything. |
| `textStyles`/`layoutStyles` exported as empty objects | Omit them entirely | Exporting empty ensures import paths resolve for downstream components that will be added in future phases. |
| `src/` directory deleted entirely | Keep it and move directories individually | Cleaner to delete all and rebuild. Ensures no stale files remain. |

## Assumptions

1. The `app/screens/` directory will NOT auto-register as Expo Router routes — only files directly in `app/` (or route groups like `app/(tabs)/`) are routes. Files under `app/screens/` are importable modules, not routes. This matches nestled's pattern.
2. `react-native-gesture-handler` must be imported at the top of `_layout.tsx` for proper gesture subsystem initialization. This is the standard Expo Router convention.
3. No `.env.local` needs to be created — the skeleton doesn't connect to a backend. `EXPO_PUBLIC_API_BASE_URL` from `.env.example` is sufficient for future use.
4. `tsconfig.json` paths config (`@dwatcher/*` → `../../packages/*/src`) needs no changes.
5. `.npmrc` with `shamefully-hoist=true` and `strict-peer-dependencies=false` ensures `react-native-gesture-handler` and `react-native-safe-area-context` resolve without peer dependency issues on pnpm.
6. The `color` export in `src/theme/index.ts` (`colors = dwatcherPalette`) is safe — it's a const object alias, not mutable state.

## Proposed PR Description

**Summary**: Restructure the dwatcher mobile app skeleton by stripping the current Phase 0 implementation and applying nestled-frontend structural patterns. This creates a clean skeleton with a theme system, ScreenShell layout component, UI primitives, Zustand stores, TanStack Query, Jest testing setup, and a placeholder HomeScreen in `app/screens/`. The result is a working app that opens immediately via QR scan with no domain logic — "funcional aunque no tenga nada."

**Tasks**:
- [x] Stage 1: Strip current mobile app implementation to skeleton
- [x] Stage 2: Update package.json — add Zustand, TanStack Query, jest, icons, gesture-handler
- [x] Stage 3: Create app theme system (palette, spacing, radii, shadows, typography)
- [x] Stage 4: Create ScreenShell layout component, ScreenBrandTitle, safe area utils
- [x] Stage 5: Create SideMenuOverlay, PrimaryButton, GhostButton UI components
- [x] Stage 6: Create placeholder HomeScreen in app/screens/ with thin route file
- [x] Stage 7: Update RootLayout to register screens, use theme tokens, import gesture handler
- [x] Stage 8: Add LoadingState component and ErrorBoundary with dev logging
- [x] Stage 9: Scaffold empty Zustand stores (session, event, settings)
- [x] Stage 10: Create TanStack Query client provider and wrap root layout
- [x] Stage 11: Add HomeScreen render test
- [x] Stage 12: Refresh lockfile and verify full workspace

**Notes / Out of Scope**:
- No domain functionality (monitoring, audio, ML, camera, WebRTC, backend) — skeleton only
- No Google Fonts — using system fonts (Roboto on Android)
- No `@dwatcher/theme` package — theme is local to the mobile app
- `apps/backend/` and all `packages/` (config, types, audio, ml) are untouched
- `textStyles` and `layoutStyles` exported as empty objects for future population
- SideMenuOverlay has one placeholder menu item ("Settings") with `route: null`
- Existing `.claude/rules/`, `docs/`, root config files are unchanged
- CI workflows are not modified

**Closes**: N/A
