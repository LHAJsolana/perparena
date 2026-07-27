export function assertSimulationResetAllowed(
  env: Record<string, string | undefined> = process.env,
) {
  if (env.NODE_ENV === "production") {
    throw new Error(
      "simulation:reset refuses to run when NODE_ENV=production.",
    );
  }
}
