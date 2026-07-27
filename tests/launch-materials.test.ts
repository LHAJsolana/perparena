import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const launchDir = join(root, "docs", "launch");
const launchFiles = [
  "project-summary.md",
  "x-posts.md",
  "linkedin.md",
  "demo-script.md",
  "screenshot-plan.md",
  "portfolio-case-study.md",
  "social-preview-brief.md",
];

function readLaunch(file: string) {
  return readFileSync(join(launchDir, file), "utf8");
}

describe("launch materials", () => {
  it("creates every required launch document", () => {
    for (const file of launchFiles) {
      expect(existsSync(join(launchDir, file)), file).toBe(true);
    }
  });

  it("keeps social copy explicit about simulation", () => {
    const combined = launchFiles.map(readLaunch).join("\n");

    expect(combined).toMatch(/synthetic/i);
    expect(combined).toMatch(/simulated/i);
    expect(combined).toMatch(/does not execute trades/i);
  });

  it("does not include prohibited launch claims", () => {
    const combined = launchFiles.map(readLaunch).join("\n").toLowerCase();

    expect(combined).not.toContain("revolutionary");
    expect(combined).not.toContain("guaranteed fair");
    expect(combined).not.toContain("fraud-proof");
    expect(combined).not.toContain("production-ready");
    expect(combined).not.toContain("adrena affiliation");
  });

  it("does not embed fake screenshot images", () => {
    const screenshotPlan = readLaunch("screenshot-plan.md");
    const socialPreview = readLaunch("social-preview-brief.md");

    expect(screenshotPlan).not.toMatch(/!\[[^\]]*]\(/);
    expect(socialPreview).toContain("Do not generate or publish automatically");
  });
});
