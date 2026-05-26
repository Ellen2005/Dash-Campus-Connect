import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "[Dash] DATABASE_URL is not configured. Set DATABASE_URL in .env.local or environment before starting the app."
    );
  }

  const isLocalDb = /localhost|127\.0\.0\.1/.test(connectionString);
  if (!isLocalDb) {
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_SELF_SIGNED_DB_CERT !== "false"
    ) {
      // Dev-only fallback for environments that intercept TLS certificates.
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    try {
      const url = new URL(connectionString);
      // Let node-postgres SSL object drive TLS behavior in development.
      url.searchParams.delete("sslmode");
      if (!url.searchParams.has("uselibpqcompat")) {
        url.searchParams.set("uselibpqcompat", "true");
      }
      connectionString = url.toString();
    } catch {
      // Keep original string if URL parsing fails.
    }
  }
  const rejectUnauthorized =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true";

  const pool = new Pool({
    connectionString,
    ...(isLocalDb
      ? {}
      : {
          // Some local/dev environments fail TLS chain validation against managed DBs.
          // Set DATABASE_SSL_REJECT_UNAUTHORIZED=true to enforce strict validation.
          ssl: { rejectUnauthorized },
        }),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as any);
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
