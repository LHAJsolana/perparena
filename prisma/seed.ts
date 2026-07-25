import { seedSimulation } from "@/features/simulation/persistence";
import { prisma } from "@/lib/db/prisma";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("db:seed refuses to run when NODE_ENV=production.");
  }

  const summary = await seedSimulation(prisma);

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
