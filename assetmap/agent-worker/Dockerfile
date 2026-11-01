# AssetMap agent worker — headless BullMQ worker (no port).
# Build context: assetmap/agent-worker
#   docker build -t assetmap-agent-worker assetmap/agent-worker

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run typecheck && npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    AGENT_HEARTBEAT_FILE=/tmp/agent-worker.heartbeat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

USER node

# Healthy while the heartbeat file was rewritten in the last 2 minutes
# (the worker only writes it while its workers run and Postgres + Redis answer).
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD sh -c 'test -n "$(find "$AGENT_HEARTBEAT_FILE" -mmin -2 2>/dev/null)"'

# SIGTERM → stop taking jobs, finish the current run (max 25s), close connections
STOPSIGNAL SIGTERM
CMD ["node", "--enable-source-maps", "dist/index.js"]
