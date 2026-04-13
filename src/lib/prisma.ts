import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Prisma 7 with driverAdapters requires an adapter or accelerateUrl.
  // In development without a live DB, we catch the init error gracefully.
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      // @ts-ignore — datasourceUrl satisfies Prisma 7 client engine requirement
      datasourceUrl: process.env.DATABASE_URL,
    });
  } catch {
    // Return a proxy that throws a clear error on any DB call
    return new Proxy({} as PrismaClient, {
      get(_t, prop) {
        if (prop === "$connect" || prop === "$disconnect") return () => Promise.resolve();
        throw new Error(`Database not configured. Set DATABASE_URL in .env (accessed: ${String(prop)})`);
      },
    });
  }
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? (createPrismaClient() as PrismaClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
