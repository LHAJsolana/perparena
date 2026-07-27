import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (value) =>
        value.startsWith("postgresql://") || value.startsWith("postgres://"),
      {
        message: "DATABASE_URL must use a PostgreSQL connection string",
      },
    )
    .optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(env: Record<string, string | undefined>): AppEnv {
  return envSchema.parse(env);
}

export const appEnv = parseEnv(process.env);

export function getDatabaseUrlStatus(
  env: Record<string, string | undefined> = process.env,
) {
  const parsed = envSchema.pick({ DATABASE_URL: true }).safeParse(env);
  const configured = Boolean(parsed.success && parsed.data.DATABASE_URL);
  const requiredButMissing = env.NODE_ENV === "production" && !configured;

  return {
    configured,
    required: env.NODE_ENV === "production",
    valid: parsed.success && !requiredButMissing,
  };
}
