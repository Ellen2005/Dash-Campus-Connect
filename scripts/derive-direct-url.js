/**
 * Build a Session pooler URL (port 5432) from DATABASE_URL when db.*.supabase.co does not resolve.
 * Usage: node scripts/derive-direct-url.js
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const pooled = process.env.DATABASE_URL;
if (!pooled) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

try {
  const url = new URL(pooled);
  url.port = "5432";
  url.searchParams.delete("pgbouncer");
  url.searchParams.delete("pgbouncer");
  if (!url.searchParams.has("sslmode")) {
    url.searchParams.set("sslmode", "require");
  }
  const direct = url.toString();
  console.log("\nAdd this to .env.local as DIRECT_URL (Session pooler — use for migrations):\n");
  console.log(`DIRECT_URL=${direct}\n`);
  console.log("Then run: npm run db:test && npm run db:migrate\n");
} catch (e) {
  console.error("Could not parse DATABASE_URL:", e.message);
  process.exit(1);
}
