## TypeScript Conventions

### Shared types location

`@dwatcher/types` is the single source of truth for all types shared across apps or packages.

**Belongs in `@dwatcher/types`:**

- Domain entity interfaces (`Dog`, `Session`, `BarkEvent`, `AnxietyEvent`, `Snapshot`)
- API request and response shapes
- Shared enums (`DetectionClass`, `SessionState`, `AlertLevel`, `AnxietyFactor`, `SignalMessageType`)
- Utility types used in more than one package

**Does NOT belong in `@dwatcher/types`:**

- Types used only inside a single package — keep them local to that package
- React component prop types tied to one app — keep them local
- Any runtime logic or executable code — types package is types only

### `@dwatcher/types` internal structure

```
packages/types/src/
├── index.ts         ← re-exports everything
├── entities/        ← domain interfaces (Dog, Session, BarkEvent, AnxietyEvent, Snapshot)
├── api/             ← request and response shapes
└── enums/           ← shared enums (DetectionClass, SessionState, AlertLevel, AnxietyFactor, SignalMessageType)
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
      ├── @dwatcher/config
      ├── @dwatcher/audio
      ├── @dwatcher/ml
      ├── @dwatcher/mobile
      └── @dwatcher/backend
```

### Imports

Always import from a package's entry point — never from internal paths:

```ts
// ❌ Never
import { Asset } from '@dwatcher/types/src/entities/asset';

// ✅ Always
import { Asset } from '@dwatcher/types';
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
