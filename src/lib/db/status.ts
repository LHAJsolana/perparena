import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getDatabaseUrlStatus } from "@/lib/env";

export type DatabaseStatus =
  | { state: "configured"; connected: false; reason: "not_checked" }
  | { state: "connected"; connected: true }
  | { state: "unavailable"; connected: false; reason: string };

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const configured = getDatabaseUrlStatus();

  if (!configured.configured) {
    return {
      state: "unavailable",
      connected: false,
      reason: "DATABASE_URL is not configured",
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return { state: "connected", connected: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return {
        state: "unavailable",
        connected: false,
        reason: "PostgreSQL connection could not be initialized",
      };
    }

    return {
      state: "unavailable",
      connected: false,
      reason: "PostgreSQL connectivity check failed",
    };
  }
}
