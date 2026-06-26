# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
# Copy all workspace package.json files (needed for dependency graph)
COPY apps/backend/package.json apps/backend/
COPY apps/backend/tsconfig.json apps/backend/
COPY packages/types/package.json packages/types/
COPY packages/types/tsconfig.json packages/types/
COPY packages/config/package.json packages/config/
COPY packages/config/tsconfig.json packages/config/
COPY packages/audio/package.json packages/audio/
COPY packages/audio/tsconfig.json packages/audio/
COPY packages/ml/package.json packages/ml/
COPY packages/ml/tsconfig.json packages/ml/

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend/src apps/backend/src/
COPY packages/ ./packages/

# Build packages that have a build step
RUN pnpm --filter @dwatcher/config build

# ── Runtime stage ──────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=builder /app /app

ENV NODE_ENV=production

EXPOSE 3000 3001

CMD ["node", "apps/backend/src/index.ts"]
