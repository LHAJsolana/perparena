import { calculateParticipantAnalytics } from "@/features/analytics/calculations";
import { assessParticipantIntegrity } from "@/features/integrity/engine";
import { summarizeIntegrityAssessments } from "@/features/integrity/persistence";
import { generateSimulation } from "@/features/simulation/generator";

const dataset = generateSimulation();
const marketById = new Map(
  dataset.markets.map((market) => [market.id, market.symbol]),
);
const assessments = dataset.participants.map((participant) => {
  const trades = dataset.trades
    .filter((trade) => trade.participantId === participant.id)
    .map((trade) => ({
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
    }));

  return assessParticipantIntegrity({
    participantId: participant.id,
    archetype: participant.archetype,
    startsAt: dataset.competition.startsAt,
    endsAt: dataset.competition.endsAt,
    trades,
    analytics: calculateParticipantAnalytics({
      startingEquity: participant.startingEquity,
      startsAt: dataset.competition.startsAt,
      endsAt: dataset.competition.endsAt,
      trades,
    }),
  });
});

console.log(
  JSON.stringify(summarizeIntegrityAssessments(assessments), null, 2),
);
