import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Page } from "@playwright/test";

export type EvidenceStep = {
  step: string;
  status: "passed" | "failed";
  path: string;
  details?: Record<string, unknown>;
};

export class BetaEvidence {
  private readonly steps: EvidenceStep[] = [];
  private readonly browserErrors: Array<{
    kind: "console" | "page" | "request" | "response";
    message: string;
    url?: string;
  }> = [];
  private readonly outputPath: string;

  constructor(private readonly runId: string) {
    this.outputPath = path.join(
      process.cwd(),
      "e2e",
      "artifacts",
      `beta-${runId}.json`,
    );
  }

  observe(page: Page) {
    page.on("console", (message) => {
      if (message.type() === "error") {
        this.browserErrors.push({
          kind: "console",
          message: message.text(),
          url: page.url(),
        });
      }
    });
    page.on("pageerror", (error) => {
      this.browserErrors.push({
        kind: "page",
        message: error.message,
        url: page.url(),
      });
    });
    page.on("requestfailed", (request) => {
      this.browserErrors.push({
        kind: "request",
        message: request.failure()?.errorText ?? "Request failed",
        url: request.url(),
      });
    });
    page.on("response", (response) => {
      if (response.status() >= 500) {
        this.browserErrors.push({
          kind: "response",
          message: `HTTP ${response.status()}`,
          url: response.url(),
        });
      }
    });
  }

  async record(step: EvidenceStep) {
    this.steps.push(step);
  }

  async flush() {
    await mkdir(path.dirname(this.outputPath), { recursive: true });
    await writeFile(
      this.outputPath,
      JSON.stringify(
        {
          runId: this.runId,
          createdAt: new Date().toISOString(),
          steps: this.steps,
          browserErrors: this.browserErrors,
        },
        null,
        2,
      ),
      "utf8",
    );
  }

  outputExists() {
    return existsSync(this.outputPath);
  }
}
