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
    await queryDatabaseWithRetry();

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

async function queryDatabaseWithRetry(attempts = 4) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }
    }
  }

  throw lastError;
}
