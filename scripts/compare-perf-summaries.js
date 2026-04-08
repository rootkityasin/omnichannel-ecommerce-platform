#!/usr/bin/env node

const fs = require("fs");

function usage() {
  console.log("Usage: node scripts/compare-perf-summaries.js <before.summary.txt> <after.summary.txt>");
}

function parseSummary(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const readMetric = (label) => {
    const match = text.match(new RegExp(`${label}:\\s*([0-9]+(?:\\.[0-9]+)?)%?`, "i"));
    return match ? Number(match[1]) : null;
  };

  const appPeak = readMetric("app peak cpu");
  const dbPeak = readMetric("db peak cpu");
  const proxyPeak = readMetric("proxy peak cpu");

  return {
    filePath,
    appPeak,
    dbPeak,
    proxyPeak,
  };
}

function formatDelta(before, after) {
  if (before == null || after == null) return "n/a";
  const delta = after - before;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(2)}%`;
}

function formatChange(before, after) {
  if (before == null || after == null) return "n/a";
  const delta = after - before;
  if (delta < 0) return "improved";
  if (delta > 0) return "regressed";
  return "unchanged";
}

function main() {
  const [, , beforePath, afterPath] = process.argv;
  if (!beforePath || !afterPath) {
    usage();
    process.exit(1);
  }

  if (!fs.existsSync(beforePath) || !fs.existsSync(afterPath)) {
    console.error("One or both summary files were not found.");
    process.exit(1);
  }

  const before = parseSummary(beforePath);
  const after = parseSummary(afterPath);

  console.log("Performance Summary Comparison");
  console.log(`Before: ${before.filePath}`);
  console.log(`After:  ${after.filePath}`);
  console.log("");

  const rows = [
    ["App Peak CPU", before.appPeak, after.appPeak],
    ["DB Peak CPU", before.dbPeak, after.dbPeak],
    ["Proxy Peak CPU", before.proxyPeak, after.proxyPeak],
  ];

  for (const [name, b, a] of rows) {
    const beforeText = b == null ? "n/a" : `${b.toFixed(2)}%`;
    const afterText = a == null ? "n/a" : `${a.toFixed(2)}%`;
    const deltaText = formatDelta(b, a);
    const change = formatChange(b, a);
    console.log(`${name}: before=${beforeText} after=${afterText} delta=${deltaText} (${change})`);
  }
}

main();
