import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("[Dash] DATABASE_URL not set — DB calls will fail gracefully.");
    return new Proxy({} as PrismaClient, {
      get(_t, prop) {
        if (prop === "$connect" || prop === "$disconnect") return () => Promise.resolve();
        if (prop === "$transaction") return async (fn: any) => fn({});
        return new Proxy(() => Promise.reject(new Error("Database not configured. Set DATABASE_URL in .env")), {
          get: () => () => Promise.reject(new Error("Database not configured. Set DATABASE_URL in .env")),
        });
      },
    });
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as any);
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
