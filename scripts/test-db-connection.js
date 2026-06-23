/**
 * Quick check that DIRECT_URL / DATABASE_URL can reach Supabase Postgres.
 * Usage: node scripts/test-db-connection.js
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { Client } = require("pg");

async function tryConnect(label, connectionString) {
  if (!connectionString) {
    console.log(`[${label}] not set — skip`);
    return false;
  }
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  try {
    await client.connect();
    const r = await client.query("SELECT 1 AS ok");
    console.log(`[${label}] OK — connected (${r.rows[0]?.ok})`);
    await client.end();
    return true;
  } catch (e) {
    console.error(`[${label}] FAILED —`, e.message);
    if (label.includes("DIRECT") && /ENOTFOUND.*db\..*\.supabase\.co/i.test(`${e.message}`)) {
      console.error(
        "  → Host db.*.supabase.co did not resolve. Use Session pooler on port 5432 instead:\n" +
          "     Run: node scripts/derive-direct-url.js\n" +
          "     Or Supabase Dashboard → Database → Connection string → Session mode (port 5432)"
      );
    }
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    return false;
  }
}

(async () => {
  console.log("Testing database connectivity...\n");
  const direct = process.env.DIRECT_URL;
  const pooled = process.env.DATABASE_URL;

  const directOk = await tryConnect("DIRECT_URL (5432, migrations)", direct);
  const poolOk = await tryConnect("DATABASE_URL (6543, app)", pooled);

  if (!directOk && !poolOk) {
    console.log("\nTips:");
    console.log("  1. Supabase Dashboard → Project Settings → Database — copy URI strings");
    console.log("  2. Add DIRECT_URL (port 5432) and DATABASE_URL (port 6543 + ?pgbouncer=true) to .env.local");
    console.log("  3. Ensure project is not paused (free tier sleeps after inactivity)");
    console.log("  4. URL-encode special characters in the database password");
    process.exit(1);
  }
  process.exit(directOk ? 0 : 1);
})();
