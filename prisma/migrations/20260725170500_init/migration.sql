-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'FINALIZING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MarketSymbol" AS ENUM ('BTC_PERP', 'ETH_PERP', 'SOL_PERP');

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "TradeExitReason" AS ENUM ('TARGET', 'STOP', 'LIQUIDATION', 'MANUAL', 'EXPIRED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Division" AS ENUM ('OPEN', 'PROVISIONAL', 'RISK_LAB');

-- CreateEnum
CREATE TYPE "IntegrityFlagType" AS ENUM ('VOLUME_ANOMALY', 'DRAWDOWN_ANOMALY', 'CORRELATED_TRADING', 'WASH_TRADING_HEURISTIC', 'DATA_QUALITY', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "IntegritySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IntegrityStatus" AS ENUM ('OPEN', 'REVIEWING', 'DISMISSED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('PARTICIPATION', 'RISK_MANAGEMENT', 'CONSISTENCY', 'EDUCATION');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('LOCKED', 'ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('CONSISTENCY', 'RISK_CONTROL', 'RECOVERY', 'PARTICIPATION');

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CompetitionStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionMarket" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "symbol" "MarketSymbol" NOT NULL,
    "displayName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionConfiguration" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "startingEquity" DECIMAL(20,8) NOT NULL,
    "maxLeverage" DECIMAL(10,4) NOT NULL,
    "minimumQualifiedTrades" INTEGER NOT NULL DEFAULT 0,
    "minimumSimulatedVolume" DECIMAL(24,8) NOT NULL DEFAULT 0,
    "scoringVersion" TEXT NOT NULL,
    "riskWeight" DECIMAL(10,6) NOT NULL,
    "consistencyWeight" DECIMAL(10,6) NOT NULL,
    "pnlWeight" DECIMAL(10,6) NOT NULL,
    "volumeWeight" DECIMAL(10,6) NOT NULL,
    "integrityPenaltyWeight" DECIMAL(10,6) NOT NULL,
    "scoreComponentCaps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "displayName" TEXT,
    "division" "Division" NOT NULL DEFAULT 'OPEN',
    "startingEquity" DECIMAL(20,8) NOT NULL,
    "currentEquity" DECIMAL(20,8) NOT NULL,
    "maximumDrawdown" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "qualifiedTradeCount" INTEGER NOT NULL DEFAULT 0,
    "simulatedVolume" DECIMAL(24,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "competitionMarketId" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "entryPrice" DECIMAL(24,10) NOT NULL,
    "exitPrice" DECIMAL(24,10),
    "size" DECIMAL(24,8) NOT NULL,
    "leverage" DECIMAL(10,4) NOT NULL,
    "simulatedVolume" DECIMAL(24,8) NOT NULL,
    "simulatedPnl" DECIMAL(24,8),
    "fees" DECIMAL(24,8) NOT NULL DEFAULT 0,
    "isQualified" BOOLEAN NOT NULL DEFAULT false,
    "exitReason" "TradeExitReason",
    "malformedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPerformance" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "startingEquity" DECIMAL(20,8) NOT NULL,
    "endingEquity" DECIMAL(20,8) NOT NULL,
    "simulatedPnl" DECIMAL(24,8) NOT NULL,
    "simulatedVolume" DECIMAL(24,8) NOT NULL,
    "maximumDrawdown" DECIMAL(20,8) NOT NULL,
    "qualifiedTrades" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreBreakdown" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scoringVersion" TEXT NOT NULL,
    "competitionScore" DECIMAL(18,8) NOT NULL,
    "pnlComponent" DECIMAL(18,8) NOT NULL,
    "riskComponent" DECIMAL(18,8) NOT NULL,
    "consistencyComponent" DECIMAL(18,8) NOT NULL,
    "volumeComponent" DECIMAL(18,8) NOT NULL,
    "integrityPenalty" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "componentDetails" JSONB,

    CONSTRAINT "ScoreBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardSnapshotEntry" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "competitionScore" DECIMAL(18,8) NOT NULL,
    "currentEquity" DECIMAL(20,8) NOT NULL,
    "simulatedPnl" DECIMAL(24,8) NOT NULL,
    "simulatedVolume" DECIMAL(24,8) NOT NULL,
    "maximumDrawdown" DECIMAL(20,8) NOT NULL,
    "division" "Division" NOT NULL,

    CONSTRAINT "LeaderboardSnapshotEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "QuestType" NOT NULL,
    "status" "QuestStatus" NOT NULL DEFAULT 'LOCKED',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "requirements" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestProgress" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "QuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "progressValue" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "type" "AchievementType" NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "bestCount" INTEGER NOT NULL DEFAULT 0,
    "lastCountedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "AchievementType" NOT NULL,
    "criteria" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantAchievement" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "ParticipantAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrityFlag" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "type" "IntegrityFlagType" NOT NULL,
    "severity" "IntegritySeverity" NOT NULL,
    "status" "IntegrityStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "evidence" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrityFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Competition_slug_key" ON "Competition"("slug");

-- CreateIndex
CREATE INDEX "Competition_status_startsAt_idx" ON "Competition"("status", "startsAt");

-- CreateIndex
CREATE INDEX "Competition_endsAt_idx" ON "Competition"("endsAt");

-- CreateIndex
CREATE INDEX "CompetitionMarket_symbol_idx" ON "CompetitionMarket"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionMarket_competitionId_symbol_key" ON "CompetitionMarket"("competitionId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionConfiguration_competitionId_key" ON "CompetitionConfiguration"("competitionId");

-- CreateIndex
CREATE INDEX "Participant_competitionId_division_idx" ON "Participant"("competitionId", "division");

-- CreateIndex
CREATE INDEX "Participant_wallet_idx" ON "Participant"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_competitionId_wallet_key" ON "Participant"("competitionId", "wallet");

-- CreateIndex
CREATE INDEX "Trade_participantId_openedAt_idx" ON "Trade"("participantId", "openedAt");

-- CreateIndex
CREATE INDEX "Trade_competitionMarketId_openedAt_idx" ON "Trade"("competitionMarketId", "openedAt");

-- CreateIndex
CREATE INDEX "Trade_isQualified_idx" ON "Trade"("isQualified");

-- CreateIndex
CREATE INDEX "DailyPerformance_day_idx" ON "DailyPerformance"("day");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPerformance_participantId_day_key" ON "DailyPerformance"("participantId", "day");

-- CreateIndex
CREATE INDEX "ScoreBreakdown_participantId_calculatedAt_idx" ON "ScoreBreakdown"("participantId", "calculatedAt");

-- CreateIndex
CREATE INDEX "ScoreBreakdown_competitionScore_idx" ON "ScoreBreakdown"("competitionScore");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_competitionId_capturedAt_idx" ON "LeaderboardSnapshot"("competitionId", "capturedAt");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshotEntry_participantId_idx" ON "LeaderboardSnapshotEntry"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardSnapshotEntry_snapshotId_rank_key" ON "LeaderboardSnapshotEntry"("snapshotId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardSnapshotEntry_snapshotId_participantId_key" ON "LeaderboardSnapshotEntry"("snapshotId", "participantId");

-- CreateIndex
CREATE INDEX "Quest_competitionId_status_idx" ON "Quest"("competitionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Quest_competitionId_slug_key" ON "Quest"("competitionId", "slug");

-- CreateIndex
CREATE INDEX "QuestProgress_participantId_status_idx" ON "QuestProgress"("participantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuestProgress_questId_participantId_key" ON "QuestProgress"("questId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Streak_participantId_type_key" ON "Streak"("participantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_slug_key" ON "Achievement"("slug");

-- CreateIndex
CREATE INDEX "Achievement_type_idx" ON "Achievement"("type");

-- CreateIndex
CREATE INDEX "ParticipantAchievement_achievementId_idx" ON "ParticipantAchievement"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantAchievement_participantId_achievementId_key" ON "ParticipantAchievement"("participantId", "achievementId");

-- CreateIndex
CREATE INDEX "IntegrityFlag_participantId_status_idx" ON "IntegrityFlag"("participantId", "status");

-- CreateIndex
CREATE INDEX "IntegrityFlag_severity_status_idx" ON "IntegrityFlag"("severity", "status");

-- CreateIndex
CREATE INDEX "IntegrityFlag_type_idx" ON "IntegrityFlag"("type");

-- AddForeignKey
ALTER TABLE "CompetitionMarket" ADD CONSTRAINT "CompetitionMarket_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionConfiguration" ADD CONSTRAINT "CompetitionConfiguration_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_competitionMarketId_fkey" FOREIGN KEY ("competitionMarketId") REFERENCES "CompetitionMarket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPerformance" ADD CONSTRAINT "DailyPerformance_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreBreakdown" ADD CONSTRAINT "ScoreBreakdown_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardSnapshotEntry" ADD CONSTRAINT "LeaderboardSnapshotEntry_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "LeaderboardSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardSnapshotEntry" ADD CONSTRAINT "LeaderboardSnapshotEntry_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestProgress" ADD CONSTRAINT "QuestProgress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestProgress" ADD CONSTRAINT "QuestProgress_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantAchievement" ADD CONSTRAINT "ParticipantAchievement_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantAchievement" ADD CONSTRAINT "ParticipantAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrityFlag" ADD CONSTRAINT "IntegrityFlag_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

