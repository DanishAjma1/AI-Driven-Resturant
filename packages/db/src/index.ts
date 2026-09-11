import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __embergrainPrisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma client. In dev, Next.js hot-reloads modules, which would
 * otherwise spin up a new PrismaClient (and DB connection pool) per reload.
 * We cache the instance on `globalThis` to avoid that.
 */
export const prisma: PrismaClient =
  globalThis.__embergrainPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__embergrainPrisma = prisma;
}

export * from "@prisma/client";
