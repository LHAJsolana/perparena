import { recalculateCompetitionScores } from "@/features/scoring/persistence";
import { prisma } from "@/lib/db/prisma";

async function main() {
  const summary = await recalculateCompetitionScores(prisma);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Score recalculation failed.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
