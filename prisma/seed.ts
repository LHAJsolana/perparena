import { seedSimulation } from "@/features/simulation/persistence";
import {
  assertSimulationSeedAllowed,
  shouldResetExistingSeedData,
} from "@/features/simulation/seed-safety";
import { prisma } from "@/lib/db/prisma";

async function main() {
  assertSimulationSeedAllowed();

  const summary = await seedSimulation(prisma, {
    resetExisting: shouldResetExistingSeedData(),
  });

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Simulation seed failed.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
