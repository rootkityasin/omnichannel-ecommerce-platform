#!/bin/sh
set -e

echo "Starting Prisma migrations..."
# Auto-detects and deploys any newly committed migrations in prisma/migrations
npx prisma migrate deploy

echo "Starting Next.js..."
exec "$@"
