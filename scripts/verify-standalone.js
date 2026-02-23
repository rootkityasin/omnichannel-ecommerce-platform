const fs = require("fs");

const requiredPaths = ["./.next/required-server-files.json", "./.next/static"];

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
