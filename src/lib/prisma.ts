import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma singleton. En desarrollo se guarda en `globalThis` para que el
 * hot reload de Next no abra una conexión nueva en cada recarga.
 */
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalParaPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = prisma;
