export const adminBannerText = "Demonstration administration environment.";

export function getAdminMutationMode(env = process.env) {
  const enabled =
    env.NODE_ENV !== "production" &&
    env.PERPARENA_ADMIN_MUTATIONS === "enabled";

  return {
    enabled,
    label: enabled
      ? "Development mutation mode enabled"
      : "Read-only demo mode",
    reason: enabled
      ? "Server actions may write to the configured development database."
      : "Mutating server actions are disabled unless PERPARENA_ADMIN_MUTATIONS=enabled outside production.",
  };
}

export function assertAdminMutationAllowed(env = process.env) {
  const mode = getAdminMutationMode(env);

  if (!mode.enabled) {
    throw new Error(mode.reason);
  }
}
