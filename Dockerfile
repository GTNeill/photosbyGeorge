# ---- Build stage ----
FROM oven/bun:1.3.5 AS builder

WORKDIR /app

# Copy package manifests
COPY package.json bun.lock turbo.json tsconfig.json ./
COPY packages/web/package.json ./packages/web/
COPY packages/desktop/package.json ./packages/desktop/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY packages/web ./packages/web
COPY packages/desktop ./packages/desktop

# Build frontend (web only — no desktop renderer needed)
RUN cd packages/web && bunx vite build

# ---- Runtime stage ----
FROM oven/bun:1.3.5-slim

WORKDIR /app

# Copy only what the server needs
COPY --from=builder /app/packages/web/src ./packages/web/src
COPY --from=builder /app/packages/web/dist ./packages/web/dist
COPY --from=builder /app/packages/web/package.json ./packages/web/
COPY --from=builder /app/packages/web/node_modules ./packages/web/node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["bun", "packages/web/src/server.ts"]
