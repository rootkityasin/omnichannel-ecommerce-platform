#!/usr/bin/env bash
set -euo pipefail

APP_SERVICE_PREFIX="omnichannelecommerceplatform-crab-khai-c9k6uf"
DB_SERVICE_PREFIX="omnichannelecommerceplatform-crabkhaidb-cdnm87"
TRAEFIK_NAME="dokploy-traefik"

APP_CONTAINER=$(docker ps --format '{{.Names}}' | grep "^${APP_SERVICE_PREFIX}\." | head -n 1)
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep "^${DB_SERVICE_PREFIX}\." | head -n 1)

if [[ -z "${APP_CONTAINER}" || -z "${DB_CONTAINER}" ]]; then
  echo "Could not resolve app or DB container."
  echo "App: ${APP_CONTAINER:-missing}"
  echo "DB: ${DB_CONTAINER:-missing}"
  exit 1
fi

echo "Profiling containers:"
echo "  app: ${APP_CONTAINER}"
echo "  db:  ${DB_CONTAINER}"
echo "  proxy: ${TRAEFIK_NAME}"
echo
echo "Reproduce the admin CPU spike now. Sampling for 30 seconds..."
echo

for i in $(seq 1 30); do
  echo "===== sample ${i} @ $(date '+%F %T %Z') ====="
  docker stats --no-stream --format '{{.Name}}|CPU={{.CPUPerc}}|MEM={{.MemUsage}}|NET={{.NetIO}}' \
    "${APP_CONTAINER}" "${DB_CONTAINER}" "${TRAEFIK_NAME}" || true
  echo "----- postgres activity -----"
  docker exec -e PGPASSWORD='ar0aengeil4sheeC' -i "${DB_CONTAINER}" \
    psql -h localhost -U crabkhai_user -d crabkhai -At -c \
    "SELECT pid || '|' || state || '|' || wait_event_type || '|' || COALESCE(wait_event,'') || '|' || LEFT(query,120) FROM pg_stat_activity WHERE datname = current_database() AND state <> 'idle' ORDER BY query_start ASC LIMIT 10;" || true
  echo
  sleep 1
done

echo "Done. Compare which container spikes during reproduction."
