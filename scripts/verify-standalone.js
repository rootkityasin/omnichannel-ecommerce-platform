const fs = require("fs");

const requiredPaths = ["./.next/required-server-files.json", "./.next/static"];

const manifestCandidates = [
  "./.next/server/app/[domain]/page_client-reference-manifest.js",
  "./.next/server/app/[domain]/(client)/page_client-reference-manifest.js",
];

const missing = requiredPaths.filter((entry) => !fs.existsSync(entry));

if (missing.length) {
  console.error(
    "[Startup Check] Missing Next.js build artifacts:",
    missing.join(", "),
  );
  console.error(
    "[Startup Check] Rebuild without cache and ensure .next is copied.",
  );
  process.exit(1);
}

const manifestExists = manifestCandidates.some((entry) => fs.existsSync(entry));

if (!manifestExists) {
  console.error(
    "[Build Check] Missing client reference manifest (checked:",
    manifestCandidates.join(", "),
    ")",
  );
  process.exit(1);
}
