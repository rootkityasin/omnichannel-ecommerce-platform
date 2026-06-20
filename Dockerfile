FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ARG NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000

ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_PUBLIC_ROOT_DOMAIN=${NEXT_PUBLIC_ROOT_DOMAIN}

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
# Copy prisma directory for postinstall generation
COPY prisma ./prisma/

RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

# Add arguments for build time variables
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ARG NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000

# Pass them as environment variables during build
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_PUBLIC_ROOT_DOMAIN=${NEXT_PUBLIC_ROOT_DOMAIN}

RUN npm run build:docker

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Persistent uploads live here. Mount a Dokploy volume at /data/media in production.
RUN mkdir -p /data/media && chown -R nextjs:nodejs /data/media

# Copy public assets
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone output (includes server.js + pruned node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy static assets (not included in standalone output)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy prisma schema and migrations for production migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Copy prisma config for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.js ./
USER nextjs

EXPOSE 3003

ENV PORT=3003
# Copy entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

# Use standalone server.js directly instead of next start
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
