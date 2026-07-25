export const SCORING_VERSION = "perparena-score-v1";

export const SCORE_WEIGHTS = {
  performance: 35,
  riskManagement: 25,
  consistency: 20,
  qualifiedActivity: 10,
  marketDiversity: 10,
} as const;

export const SCORE_TOTAL = 100;

export function validateScoreWeights(weights = SCORE_WEIGHTS) {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const invalid = Object.values(weights).some(
    (value) => !Number.isFinite(value) || value < 0,
  );

  return {
    valid: total === SCORE_TOTAL && !invalid,
    total,
  };
}
