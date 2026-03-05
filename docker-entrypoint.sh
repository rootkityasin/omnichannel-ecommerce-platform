#!/bin/sh
set -e

echo "Starting Prisma migrations..."

# Clean up any failed state from the accidentally committed mis-named diff folder
npx prisma migrate resolve --rolled-back "20260306_sync_email_verified" || true

# Auto-detects and deploys any newly committed migrations in prisma/migrations
npx prisma migrate deploy

echo "Starting Next.js..."
exec "$@"
