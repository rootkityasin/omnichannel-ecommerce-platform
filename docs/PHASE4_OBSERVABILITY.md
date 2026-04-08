# Phase 4: Runtime Observability

This phase turns ad-hoc CPU checks into repeatable evidence capture for VPS incidents.

## Objective

Capture enough data in every spike window to answer:

- Is CPU pressure mainly app, DB, or proxy?
- Which query patterns were active during the spike?
- Was the host under memory pressure at the same time?

## Included in this phase

1. Timestamped profiler artifacts in `artifacts/perf`.
2. Automatic summary generation after each run.
3. Host-level context per sample (load average and memory available).
4. NPM command shortcut to run profiler script.

## Commands

Run with defaults (30 samples):

- export PGPASSWORD="your-db-password"
- npm run profile:vps

Run a longer capture (60 samples):

- export PGPASSWORD="your-db-password"
- SAMPLES=60 OUTPUT_DIR=./artifacts/perf bash scripts/profile-vps-hotspots.sh

## Expected artifacts

- `artifacts/perf/profile-<timestamp>.log`
- `artifacts/perf/profile-<timestamp>.summary.txt`

## Standard reproduction sequence

During each capture, execute exactly:

1. Dashboard
2. Orders
3. Products
4. Customers
5. Dashboard again

This keeps comparisons consistent across tuning phases.

## Read the summary first

The summary provides:

- app peak cpu
- db peak cpu
- proxy peak cpu
- top active query signatures by count

## Incident response usage

1. If app peak cpu dominates and db stays lower:
   - investigate client/server rendering and data shaping.
2. If db peak cpu dominates with repeated query signatures:
   - optimize query scopes, indexes, and pool limits.
3. If both spike together:
   - likely over-fetching and high cardinality aggregates under route transitions.

## Success criteria for optimization phases

- no sustained 100% cpu during route switching
- lower app and db peak cpu versus previous summary
- fewer repeated heavy query signatures in top 10 list

## Notes

- Keep profiling data out of commits unless explicitly needed for a performance report.
- Re-run captures after each tuning phase to preserve an audit trail of improvements.
