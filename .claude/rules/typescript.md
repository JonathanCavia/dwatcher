## TypeScript Conventions

### Shared types location

`@dwatcher/types` is the single source of truth for all types shared across apps or packages.

**Belongs in `@dwatcher/types`:**
- Domain entity interfaces (`Dog`, `BarkEvent`, `Session`, `AnxietyEvent`, `DetectionEvent`, etc.)
- API request and response shapes
- Shared enums (`DetectionClass`, `AlertLevel`, `SessionState`, etc.)
- Utility types used in more than one package

**Does NOT belong in `@dwatcher/types`:**
- Types used only inside a single package — keep them local to that package
- React component prop types tied to one app — keep them local
- Any runtime logic or executable code — types package is types only

### `@dwatcher/types` internal structure

```
packages/types/src/
├── index.ts              ← re-exports everything
├── entities/             ← domain interfaces (Dog, BarkEvent, Session, AnxietyEvent...)
├── api/                  ← request and response shapes
└── enums/                ← shared enums and constants
```

### `@dwatcher/types` has no build step

Its `package.json` points directly to source:
```json
{
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" }
}
```

Do not add a `build` script or `dist/` to `@dwatcher/types`.

### Dependency rule for types

`@dwatcher/types` must never import from any other internal `@dwatcher/*` package.

```
@dwatcher/types     ← imports nothing internal
      ↑
      ├── @dwatcher/audio
      ├── @dwatcher/ml
      ├── @dwatcher/config
      ├── @dwatcher/mobile
      └── @dwatcher/backend
```

### Shared enum values

- **DetectionClass**: `bark`, `whine`, `growl`, `howl`, `silence`
- **AlertLevel**: `info`, `warning`, `critical`
- **SessionState**: `idle`, `monitoring`, `error`

### Imports

Always import from a package's entry point — never from internal paths:

```ts
// ❌ Never
import { BarkEvent } from '@dwatcher/types/src/entities/bark-event'

// ✅ Always
import { BarkEvent } from '@dwatcher/types'
```

### tsconfig

Each package extends the root base config:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

Root `tsconfig.base.json` enforces `"strict": true`. Do not disable strict mode in any workspace.
