/**
 * Drops the local app tables, recreates them, and seeds starter data.
 */

import "dotenv/config";
import { closeDatabase, resetAndSeedDatabase } from "../src/postgresDb";

async function main() {
  await resetAndSeedDatabase();
  console.log("Postgres database reset complete: users, attendance, leaves, messages, OTPs, and projects are ready.");
}

main()
  .catch((err) => {
    console.error("Postgres setup failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
