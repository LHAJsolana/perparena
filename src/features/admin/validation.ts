import {
  CompetitionStatus,
  Division,
  IntegrityStatus,
  MarketSymbol,
  QuestType,
} from "@prisma/client";
import { z } from "zod";

const numberField = z.coerce.number().finite().nonnegative();
const publicReviewNote = z
  .string()
  .trim()
  .max(500)
  .transform((value) => value.replace(/[\u0000-\u001f\u007f]/g, ""))
  .optional();

export const scoringWeightsSchema = z
  .object({
    consistency: numberField,
    marketDiversity: numberField,
    performance: numberField,
    qualifiedActivity: numberField,
    riskManagement: numberField,
    scoringVersion: z.string().trim().min(3).max(80),
  })
  .superRefine((value, ctx) => {
    const total =
      value.performance +
      value.riskManagement +
      value.consistency +
      value.qualifiedActivity +
      value.marketDiversity;

    if (total !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Scoring weights must total exactly 100.",
        path: ["performance"],
      });
    }
  });

export const draftCompetitionSchema = z
  .object({
    description: z.string().trim().max(280).optional(),
    divisions: z.array(z.nativeEnum(Division)).min(1),
    endsAt: z.coerce.date(),
    markets: z.array(z.nativeEnum(MarketSymbol)).min(1),
    name: z.string().trim().min(3).max(120),
    questTitles: z.array(z.string().trim().min(3).max(100)).max(10),
    scoringVersion: z.string().trim().min(3).max(80),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(120)
      .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes."),
    startsAt: z.coerce.date(),
    weights: scoringWeightsSchema,
  })
  .superRefine((value, ctx) => {
    if (value.endsAt <= value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be after start date.",
        path: ["endsAt"],
      });
    }
  });

export const statusChangeSchema = z
  .object({
    endsAt: z.coerce.date(),
    startsAt: z.coerce.date(),
    status: z.nativeEnum(CompetitionStatus),
  })
  .superRefine((value, ctx) => {
    if (value.endsAt <= value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Competition date range is invalid.",
        path: ["status"],
      });
    }

    if (value.status === "COMPLETED" && value.endsAt > new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A future-ending competition cannot be marked completed.",
        path: ["status"],
      });
    }
  });

export const integrityReviewSchema = z.object({
  flagId: z.string().min(1),
  note: publicReviewNote,
  status: z.enum([
    IntegrityStatus.REVIEWING,
    IntegrityStatus.DISMISSED,
    IntegrityStatus.CONFIRMED,
  ]),
});

export const questConfigurationSchema = z.object({
  description: z.string().trim().min(3).max(280),
  title: z.string().trim().min(3).max(100),
  type: z.nativeEnum(QuestType),
});

export type DraftCompetitionInput = z.infer<typeof draftCompetitionSchema>;
export type IntegrityReviewInput = z.infer<typeof integrityReviewSchema>;
export type StatusChangeInput = z.infer<typeof statusChangeSchema>;
