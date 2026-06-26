## Backend App — apps/backend

### Execution environment (agents)

- **Run backend work on the host.** Prefer repo-root pnpm workspace commands such as `pnpm --filter @dwatcher/backend dev`, `pnpm --filter @dwatcher/backend lint`, and `pnpm --filter @dwatcher/backend typecheck`.
- Use `cd apps/backend` for backend-specific commands.

### Stack

- Framework: **Node.js** (Express or Fastify)
- Package name: `@dwatcher/backend`
- Location: `apps/backend/`

### Responsibilities

The backend provides:

- **REST API** — session management, event logging, device registration, dog profiles
- **WebSocket signaling server** — WebRTC peer-to-peer connection establishment
- **Optional cloud sync** — event aggregation, behavior analytics data persistence

### Internal package imports

```ts
import type { … } from '@dwatcher/types'
import { … } from '@dwatcher/config'
import { … } from '@dwatcher/audio'
import { … } from '@dwatcher/ml'
```

### Environment variables

- Each app owns its own `.env.local` (not committed) and `.env.example` (committed).
- Internal packages should avoid reading `process.env` directly — pass values from the app.

### Development (host)

```bash
pnpm --filter @dwatcher/backend dev
```

### Production builds (host)

```bash
pnpm --filter @dwatcher/backend build
pnpm --filter @dwatcher/backend start
```
