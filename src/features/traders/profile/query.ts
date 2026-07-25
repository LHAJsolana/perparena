import { z } from "zod";

export const traderProfileQuerySchema = z.object({
  tradesPage: z.coerce.number().int().min(1).max(999).catch(1),
});

export type TraderProfileQuery = z.infer<typeof traderProfileQuerySchema>;

export function parseTraderProfileQuery(
  searchParams: Record<string, string | string[] | undefined>,
): TraderProfileQuery {
  return traderProfileQuerySchema.parse({
    tradesPage: first(searchParams.tradesPage),
  });
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
