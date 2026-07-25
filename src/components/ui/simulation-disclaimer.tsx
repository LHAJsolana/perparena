import { appConfig } from "@/lib/config/app-config";

export function SimulationDisclaimer() {
  return (
    <p className="text-sm leading-6 text-muted">{appConfig.globalDisclaimer}</p>
  );
}
