#!/usr/bin/env bash
set -euo pipefail

APP_SERVICE_PREFIX="omnichannelecommerceplatform-crab-khai-c9k6uf"
DB_SERVICE_PREFIX="omnichannelecommerceplatform-crabkhaidb-cdnm87"
TRAEFIK_NAME="dokploy-traefik"
SAMPLES="${SAMPLES:-30}"
OUTPUT_DIR="${OUTPUT_DIR:-./artifacts/perf}"
TS="$(date '+%Y%m%d-%H%M%S')"
LOG_FILE="${OUTPUT_DIR}/profile-${TS}.log"
SUMMARY_FILE="${OUTPUT_DIR}/profile-${TS}.summary.txt"
PASSWORD_ARG="${1:-}"

APP_CONTAINER=$(docker ps --format '{{.Names}}' | grep "^${APP_SERVICE_PREFIX}\." | head -n 1)
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep "^${DB_SERVICE_PREFIX}\." | head -n 1)

mkdir -p "${OUTPUT_DIR}"

if [[ -z "${APP_CONTAINER}" || -z "${DB_CONTAINER}" ]]; then
  echo "Could not resolve app or DB container."
  echo "App: ${APP_CONTAINER:-missing}"
  echo "DB: ${DB_CONTAINER:-missing}"
  exit 1
fi

if [[ -n "${PASSWORD_ARG}" ]]; then
  PGPASSWORD="${PASSWORD_ARG}"
elif [[ -n "${PGPASSWORD:-}" ]]; then
  PGPASSWORD="${PGPASSWORD}"
elif [[ -n "${DB_PASSWORD:-}" ]]; then
  PGPASSWORD="${DB_PASSWORD}"
else
  if [[ -t 0 ]]; then
    read -r -s -p "Enter PostgreSQL password for crabkhai_user: " PGPASSWORD
    echo
  fi
fi

if [[ -z "${PGPASSWORD:-}" ]]; then
  echo "PostgreSQL password not provided. Set PGPASSWORD/DB_PASSWORD or pass it as argument." >&2
  exit 1
fi

{
  echo "Profiling containers:"
  echo "  app: ${APP_CONTAINER}"
  echo "  db:  ${DB_CONTAINER}"
  echo "  proxy: ${TRAEFIK_NAME}"
  echo "  samples: ${SAMPLES}"
  echo "  log: ${LOG_FILE}"
  echo "  summary: ${SUMMARY_FILE}"
  echo
  echo "Reproduce the admin CPU spike now. Sampling for ${SAMPLES} seconds..."
  echo
} | tee -a "${LOG_FILE}"

for i in $(seq 1 "${SAMPLES}"); do
  stamp="$(date '+%F %T %Z')"
  echo "===== sample ${i} @ ${stamp} =====" | tee -a "${LOG_FILE}"

  loadavg="$(cut -d' ' -f1-3 /proc/loadavg 2>/dev/null || echo 'n/a n/a n/a')"
  mem_available_kb="$(awk '/MemAvailable/ {print $2}' /proc/meminfo 2>/dev/null || echo '0')"
  echo "HOST|${i}|LOADAVG=${loadavg}|MEM_AVAILABLE_KB=${mem_available_kb}" | tee -a "${LOG_FILE}"

  docker stats --no-stream --format '{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.NetIO}}' \
    "${APP_CONTAINER}" "${DB_CONTAINER}" "${TRAEFIK_NAME}" 2>/dev/null | while IFS= read -r line; do
      echo "CONTAINER|${i}|${line}" | tee -a "${LOG_FILE}"
    done

  echo "PGACT|${i}|BEGIN" | tee -a "${LOG_FILE}"
  docker exec -e PGPASSWORD="${PGPASSWORD}" -i "${DB_CONTAINER}" \
    psql -h localhost -U crabkhai_user -d crabkhai -At -c \
    "SELECT pid || '|' || state || '|' || wait_event_type || '|' || COALESCE(wait_event,'') || '|' || LEFT(query,120) FROM pg_stat_activity WHERE datname = current_database() AND state <> 'idle' ORDER BY query_start ASC LIMIT 10;" 2>/dev/null | while IFS= read -r line; do
      echo "PGACT|${i}|${line}" | tee -a "${LOG_FILE}"
    done
  echo "PGACT|${i}|END" | tee -a "${LOG_FILE}"

  echo | tee -a "${LOG_FILE}"
  sleep 1
done

app_peak=$(awk -F'|' -v app="${APP_CONTAINER}" '$1=="CONTAINER" && $3==app {gsub(/%/,"",$4); if ($4+0 > max) max=$4+0} END {print max+0}' "${LOG_FILE}")
db_peak=$(awk -F'|' -v db="${DB_CONTAINER}" '$1=="CONTAINER" && $3==db {gsub(/%/,"",$4); if ($4+0 > max) max=$4+0} END {print max+0}' "${LOG_FILE}")
proxy_peak=$(awk -F'|' -v proxy="${TRAEFIK_NAME}" '$1=="CONTAINER" && $3==proxy {gsub(/%/,"",$4); if ($4+0 > max) max=$4+0} END {print max+0}' "${LOG_FILE}")

{
  echo "Profile summary"
  echo "  app peak cpu: ${app_peak}%"
  echo "  db peak cpu: ${db_peak}%"
  echo "  proxy peak cpu: ${proxy_peak}%"
  echo ""
  echo "Top active query signatures (count):"
  awk -F'|' '$1=="PGACT" && $3!="BEGIN" && $3!="END" {print $7}' "${LOG_FILE}" | sed '/^$/d' | sort | uniq -c | sort -nr | head -n 10
} | tee "${SUMMARY_FILE}"

echo "Done. Review ${SUMMARY_FILE} and ${LOG_FILE}."
