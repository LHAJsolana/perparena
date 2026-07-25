import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Division } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const schema = readFileSync(
  join(process.cwd(), "prisma/schema.prisma"),
  "utf8",
);

describe("Prisma schema architecture", () => {
  it("uses PostgreSQL and DATABASE_URL without fallback persistence", () => {
    expect(schema).toContain('provider = "postgresql"');
    expect(schema).toContain('url      = env("DATABASE_URL")');
    expect(schema).not.toContain('provider = "sqlite"');
  });

  it("defines competition slug uniqueness", () => {
    expect(schema).toMatch(/model Competition[\s\S]*slug\s+String\s+@unique/);
  });

  it("defines participant uniqueness within a competition", () => {
    expect(schema).toContain("@@unique([competitionId, wallet])");
  });

  it("defines trade relations to participant and market", () => {
    expect(schema).toContain("participant         Participant");
    expect(schema).toContain("market              CompetitionMarket");
  });

  it("exposes expected division enum behavior through generated Prisma client", () => {
    expect(Division.OPEN).toBe("OPEN");
    expect(Division.PROVISIONAL).toBe("PROVISIONAL");
    expect(Division.RISK_LAB).toBe("RISK_LAB");
  });

  it("imports the shared Prisma client safely", () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe("function");
  });
});
