import type { Competition, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type CompetitionListItem = Pick<
  Competition,
  "id" | "slug" | "name" | "status" | "startsAt" | "endsAt"
>;

export function listCompetitions(): Promise<CompetitionListItem[]> {
  return prisma.competition.findMany({
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      startsAt: true,
      endsAt: true,
    },
  });
}

export function findCompetitionBySlug(slug: string) {
  return prisma.competition.findUnique({
    where: { slug },
    include: {
      configuration: true,
      markets: true,
    },
  });
}

export function createCompetition(data: Prisma.CompetitionCreateInput) {
  return prisma.competition.create({ data });
}
