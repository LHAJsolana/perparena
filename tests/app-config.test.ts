import { describe, expect, it } from "vitest";
import { appConfig, globalDisclaimer } from "@/lib/config/app-config";
import { parseEnv } from "@/lib/env";

describe("application configuration", () => {
  it("keeps the global disclaimer explicit about simulated-only constraints", () => {
    expect(globalDisclaimer).toContain("does not execute trades");
    expect(globalDisclaimer).toContain("custody funds");
    expect(globalDisclaimer).toContain("provide financial advice");
    expect(globalDisclaimer).toContain("synthetic");
  });

  it("defines supported synthetic markets from a central module", () => {
    expect(appConfig.supportedMarkets.length).toBeGreaterThan(0);
    expect(appConfig.supportedMarkets).toContain("BTC-PERP");
  });

  it("validates expected environment defaults", () => {
    const parsed = parseEnv({});

    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });
});
