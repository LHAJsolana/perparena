import { SIMULATION_COMPETITION } from "@/features/simulation/constants";
import { getDatabaseStatus } from "@/lib/db/status";
import { prisma } from "@/lib/db/prisma";
import { getDatabaseUrlStatus } from "@/lib/env";

export type ReadinessReport = {
  ok: boolean;
  checkedAt: string;
  configuration: {
    databaseUrlConfigured: boolean;
    databaseUrlValid: boolean;
  };
  database: {
    state: "connected" | "unavailable";
    reason?: string;
  };
  seedCompetition: {
    slug: string;
    present: boolean;
  };
};

export async function getReadinessReport(): Promise<ReadinessReport> {
  const checkedAt = new Date().toISOString();
  const databaseUrl = getDatabaseUrlStatus();
  const database = await getDatabaseStatus();
  let seedCompetitionPresent = false;

  if (database.connected) {
    const seeded = await prisma.competition.findUnique({
      select: { id: true },
      where: { slug: SIMULATION_COMPETITION.slug },
    });
    seedCompetitionPresent = Boolean(seeded);
  }

  const ok =
    databaseUrl.configured &&
    databaseUrl.valid &&
    database.connected &&
    seedCompetitionPresent;

  return {
    checkedAt,
    configuration: {
      databaseUrlConfigured: databaseUrl.configured,
      databaseUrlValid: databaseUrl.valid,
    },
    database: database.connected
      ? { state: "connected" }
      : { reason: database.reason, state: "unavailable" },
    ok,
    seedCompetition: {
      present: seedCompetitionPresent,
      slug: SIMULATION_COMPETITION.slug,
    },
  };
}
