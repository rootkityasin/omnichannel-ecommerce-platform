require("dotenv/config");

const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const STATUS_MAPPINGS = [
  ["PENDING", "Placed"],
  ["Processing", "Ready"],
  ["Ready to Process", "Ready"],
  ["Ready To Fry", "Ready"],
  ["Shipped", "Delivered"],
  ["Completed", "Payment Received"],
  ["INCOMPLETE", "Incomplete"],
];

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? true
        : { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    for (const [oldStatus, newStatus] of STATUS_MAPPINGS) {
      const result = await client.query(
        'UPDATE "Order" SET "status" = $2 WHERE "status" = $1',
        [oldStatus, newStatus],
      );
      console.log(
        `${oldStatus} -> ${newStatus}: ${result.rowCount} rows updated`,
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Failed to normalize order statuses:", error);
  process.exit(1);
});
