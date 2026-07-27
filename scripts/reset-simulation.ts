import { prisma } from "@/lib/db/prisma";
import { SIMULATION_COMPETITION } from "@/features/simulation/constants";
import { assertSimulationResetAllowed } from "@/features/simulation/reset-safety";

async function main() {
  assertSimulationResetAllowed();

  const result = await prisma.$transaction(async (tx) =>
    tx.competition.deleteMany({
      where: { slug: SIMULATION_COMPETITION.slug },
    }),
  );

  console.log(
    JSON.stringify(
      {
        reset: SIMULATION_COMPETITION.slug,
        deletedCompetitions: result.count,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Simulation reset failed.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
