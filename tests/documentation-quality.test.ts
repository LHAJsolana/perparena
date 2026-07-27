import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appConfig } from "@/lib/config/app-config";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("repository documentation", () => {
  it("includes the required README sections", () => {
    const readme = read("README.md");
    const requiredHeadings = [
      "# PerpArena",
      "## Simulation Disclaimer",
      "## Product Thesis",
      "## Problem",
      "## Solution",
      "## Core Features",
      "## Screenshots",
      "## Scoring Model",
      "## Integrity Engine",
      "## Competition Divisions",
      "## Quests and Achievements",
      "## Architecture",
      "## Technology Stack",
      "## Data Model",
      "## Local Setup",
      "## Environment Variables",
      "## Database Migration",
      "## Seeding",
      "## Development Commands",
      "## Testing",
      "## Deployment",
      "## Limitations",
      "## Roadmap",
      "## Contributing",
      "## License",
      "## Disclaimer",
    ];

    for (const heading of requiredHeadings) {
      expect(readme).toContain(heading);
    }
  });

  it("keeps required documentation and governance files present", () => {
    const files = [
      "docs/architecture.md",
      "docs/data-model.md",
      "docs/simulation.md",
      "docs/analytics.md",
      "docs/scoring.md",
      "docs/integrity.md",
      "docs/engagement.md",
      "docs/api.md",
      "docs/testing.md",
      "docs/deployment.md",
      "CONTRIBUTING.md",
      "SECURITY.md",
      "CHANGELOG.md",
      "LICENSE",
      ".env.example",
    ];

    for (const file of files) {
      expect(existsSync(join(root, file)), file).toBe(true);
    }
  });

  it("does not include fake screenshots or placeholder repository URLs", () => {
    const readme = read("README.md");
    const config = read("src/lib/config/app-config.ts");

    expect(readme).toContain("No screenshots are committed yet");
    expect(readme).not.toMatch(/!\[[^\]]*]\(/);
    expect(config).not.toContain("github.com/example");
    expect(config).not.toContain("example.com/perparena");
    expect(appConfig.repositoryUrl).toBe(
      "https://github.com/LHAJsolana/perparena",
    );
  });
});
