import { describe, expect, it } from "vitest";
import { SIMULATION_MARKETS } from "@/features/simulation/constants";
import {
  generateSimulation,
  summarizeSimulation,
} from "@/features/simulation/generator";

function serialize(dataset: ReturnType<typeof generateSimulation>) {
  return JSON.stringify(dataset);
}

describe("deterministic synthetic simulation generator", () => {
  const dataset = generateSimulation();
  const summary = summarizeSimulation(dataset);

  it("produces deterministic output for the fixed seed", () => {
    expect(serialize(generateSimulation())).toBe(
      serialize(generateSimulation()),
    );
    expect(summarizeSimulation(generateSimulation())).toEqual(
      summarizeSimulation(generateSimulation()),
    );
  });

  it("meets minimum participant and trade requirements", () => {
    expect(dataset.participants.length).toBeGreaterThanOrEqual(80);
    expect(dataset.trades.length).toBeGreaterThanOrEqual(1500);
  });

  it("uses valid UTC timestamps and valid trade durations", () => {
    expect(dataset.competition.startsAt.toISOString()).toBe(
      "2026-01-05T00:00:00.000Z",
    );
    expect(dataset.competition.endsAt.toISOString()).toBe(
      "2026-01-12T00:00:00.000Z",
    );

    for (const trade of dataset.trades) {
      expect(trade.openedAt.getTime()).toBeGreaterThanOrEqual(
        dataset.competition.startsAt.getTime(),
      );
      expect(trade.closedAt.getTime()).toBeGreaterThan(
        trade.openedAt.getTime(),
      );
      expect(trade.closedAt.getTime()).toBeLessThanOrEqual(
        dataset.competition.endsAt.getTime(),
      );
    }
  });

  it("uses only supported markets", () => {
    const validMarketIds = new Set(dataset.markets.map((market) => market.id));

    expect(dataset.markets.map((market) => market.symbol)).toEqual(
      Array.from(SIMULATION_MARKETS),
    );
    expect(
      dataset.trades.every((trade) =>
        validMarketIds.has(trade.competitionMarketId),
      ),
    ).toBe(true);
  });

  it("does not generate invalid numeric values", () => {
    for (const participant of dataset.participants) {
      expect(Number.isFinite(participant.startingEquity)).toBe(true);
      expect(Number.isFinite(participant.currentEquity)).toBe(true);
      expect(participant.startingEquity).toBeGreaterThan(0);
      expect(participant.currentEquity).toBeGreaterThanOrEqual(0);
    }

    for (const trade of dataset.trades) {
      expect(Number.isFinite(trade.entryPrice)).toBe(true);
      expect(Number.isFinite(trade.exitPrice)).toBe(true);
      expect(Number.isFinite(trade.size)).toBe(true);
      expect(Number.isFinite(trade.leverage)).toBe(true);
      expect(Number.isFinite(trade.simulatedPnl)).toBe(true);
      expect(Number.isFinite(trade.fees)).toBe(true);
      expect(trade.entryPrice).toBeGreaterThan(0);
      expect(trade.exitPrice).toBeGreaterThan(0);
      expect(trade.size).toBeGreaterThan(0);
      expect(trade.leverage).toBeGreaterThan(0);
      expect(trade.fees).toBeGreaterThanOrEqual(0);
    }
  });

  it("reproduces archetype distribution and covers all required archetypes", () => {
    expect(Object.keys(summary.archetypeDistribution).sort()).toEqual(
      [
        "CONSISTENT_MEDIUM_RISK",
        "DISCIPLINED_LOW_RISK",
        "DIVERSIFIED_TRADER",
        "FREQUENTLY_LIQUIDATED",
        "HIGH_LEVERAGE_GAMBLER",
        "INACTIVE_TRADER",
        "LATE_COMPETITION_SPRINTER",
        "ONE_TRADE_WONDER",
        "REPETITIVE_SIZE_TRADER",
        "SMALL_ACCOUNT_HIGH_ROI",
        "VOLUME_FARMER",
        "WHALE",
      ].sort(),
    );
    expect(summary.archetypeDistribution).toEqual(
      summarizeSimulation(generateSimulation()).archetypeDistribution,
    );
  });

  it("includes integrity anomalies, liquidations, division coverage, and inactive traders", () => {
    const divisions = new Set(
      dataset.participants.map((participant) => participant.division),
    );
    const participantTradeCounts = new Map<string, number>();

    for (const trade of dataset.trades) {
      participantTradeCounts.set(
        trade.participantId,
        (participantTradeCounts.get(trade.participantId) ?? 0) + 1,
      );
    }

    expect(dataset.integrityFlags.length).toBeGreaterThan(0);
    expect(summary.liquidationCount).toBeGreaterThan(0);
    expect(divisions).toEqual(new Set(["OPEN", "PROVISIONAL", "RISK_LAB"]));
    expect(
      dataset.participants.some(
        (participant) =>
          (participantTradeCounts.get(participant.id) ?? 0) === 0,
      ),
    ).toBe(true);
  });

  it("documents seed idempotency through stable identifiers", () => {
    const first = generateSimulation();
    const second = generateSimulation();

    expect(first.competition.id).toBe(second.competition.id);
    expect(first.participants[0]?.id).toBe(second.participants[0]?.id);
    expect(first.trades[0]?.id).toBe(second.trades[0]?.id);
  });
});
