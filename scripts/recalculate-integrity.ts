import { recalculateCompetitionIntegrity } from "@/features/integrity/persistence";
import { prisma } from "@/lib/db/prisma";

async function main() {
  const summary = await recalculateCompetitionIntegrity(prisma);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Integrity recalculation failed.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
