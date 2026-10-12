FROM oven/bun:1.4 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM oven/bun:1.4 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:validate
RUN bun run build
# Binarios autocontenidos (el runner node:20 no ejecuta TS):
RUN bun build --compile src/db/validate.ts --outfile /app/bin/validate
RUN bun build --compile src/db/migrate.ts --outfile /app/bin/migrate

# Nota §8.2: node:20-slim (glibc) en vez de alpine (musl), porque los
# binarios --compile se generan en glibc y node:20 no ejecuta .ts.
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 MIGRATIONS_DIR=/app/migrations
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd -r app && useradd -r -g app app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/db/migrations ./migrations
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh ./bin/validate ./bin/migrate
USER app
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fs http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
