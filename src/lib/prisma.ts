import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "[Dash] DATABASE_URL is not configured. Set DATABASE_URL in .env.local or environment before starting the app."
    );
  }

  const pool = new Pool({
    connectionString,
    max: 5,                          // Limit concurrent connections to prevent pool exhaustion
    idleTimeoutMillis: 30000,         // Close idle connections after 30s
    connectionTimeoutMillis: 10000,   // Fail fast if can't connect (no more 3.5min hangs)
    allowExitOnIdle: true,
    ssl: process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true } // Proper SSL verification in production
      : false,                        // No SSL needed for local dev (localhost)
  });

  // Set query-level timeouts to prevent hanging queries
  pool.on("connect", (client) => {
    client.query("SET statement_timeout = 30000");            // 30s max per query
    client.query("SET idle_in_transaction_session_timeout = 60000"); // 60s idle tx timeout
  });

  // Handle pool errors gracefully — don't crash the process
  pool.on("error", (err) => {
    console.error("[prisma] Unexpected pool error:", err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? ["warn", "error"]
      : ["error"],
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;