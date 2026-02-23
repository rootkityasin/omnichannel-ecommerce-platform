const fs = require("fs");

const requiredPaths = ["./.next/standalone/server.js", "./.next/static"];

const missing = requiredPaths.filter((entry) => !fs.existsSync(entry));

if (missing.length) {
  console.error(
    "[Build Check] Missing Next.js standalone build artifacts:",
    missing.join(", "),
  );
  console.error(
    "[Build Check] Ensure output: 'standalone' is set in next.config.ts and rebuild.",
  );
  process.exit(1);
}

console.log("[Build Check] Standalone build artifacts verified successfully.");
