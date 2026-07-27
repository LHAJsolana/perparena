export function assertSimulationSeedAllowed(
  env: Record<string, string | undefined> = process.env,
) {
  if (
    env.NODE_ENV === "production" &&
    env.PERPARENA_ALLOW_PRODUCTION_SEED !== "enabled"
  ) {
    throw new Error(
      "db:seed refuses to run in production unless PERPARENA_ALLOW_PRODUCTION_SEED=enabled.",
    );
  }
}

export function shouldResetExistingSeedData(
  env: Record<string, string | undefined> = process.env,
) {
  return env.NODE_ENV !== "production";
}
