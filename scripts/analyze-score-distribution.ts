import { calculateParticipantAnalytics } from "@/features/analytics/calculations";
import { generateSimulation } from "@/features/simulation/generator";
import { scoreCompetitionParticipants } from "@/features/scoring/model";
import { summarizeScores } from "@/features/scoring/persistence";

const dataset = generateSimulation();
const marketById = new Map(
  dataset.markets.map((market) => [market.id, market.symbol]),
);
const inputs = dataset.participants.map((participant) => {
  const trades = dataset.trades.filter(
    (trade) => trade.participantId === participant.id,
  );

  return {
    participantId: participant.id,
    archetype: participant.archetype,
    analytics: calculateParticipantAnalytics({
      startingEquity: participant.startingEquity,
      startsAt: dataset.competition.startsAt,
      endsAt: dataset.competition.endsAt,
      trades: trades.map((trade) => ({
        id: trade.id,
        marketSymbol: marketById.get(trade.competitionMarketId)!,
        side: trade.side,
        openedAt: trade.openedAt,
        closedAt: trade.closedAt,
        size: trade.size,
        leverage: trade.leverage,
        simulatedVolume: trade.simulatedVolume,
        simulatedPnl: trade.simulatedPnl,
        fees: trade.fees,
        exitReason: trade.exitReason,
      })),
    }),
    firstQualifiedAt:
      trades
        .filter((trade) => trade.isQualified)
        .sort(
          (left, right) => left.closedAt.getTime() - right.closedAt.getTime(),
        )[0]?.closedAt ?? null,
  };
});

console.log(
  JSON.stringify(
    summarizeScores(scoreCompetitionParticipants(inputs)),
    null,
    2,
  ),
);
