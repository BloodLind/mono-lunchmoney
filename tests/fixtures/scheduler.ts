import path from "node:path";
import { expect } from "vitest";
import { SAMPLE_LUNCHMONEY_TOKEN, SAMPLE_MONO_TOKEN } from "./credentials.js";

export const SCHEDULER_FIXTURE_ROOT = "C:\\Users\\Ada\\AppData\\Roaming\\mono-lunchmoney";
export const SCHEDULER_FIXTURE_CONFIG_PATH = path.join(SCHEDULER_FIXTURE_ROOT, "config.json");
export const SCHEDULER_FIXTURE_LAUNCHER_PATH = path.join(
  SCHEDULER_FIXTURE_ROOT,
  "MonoLunchMoneySync.vbs"
);

export const SCHEDULER_FORBIDDEN_TOKENS = [
  SAMPLE_MONO_TOKEN,
  SAMPLE_LUNCHMONEY_TOKEN,
  "MONO_TOKEN",
  "LUNCHMONEY_TOKEN"
];

export function expectNoSchedulerSecrets(text: string): void {
  for (const secret of SCHEDULER_FORBIDDEN_TOKENS) {
    expect(text).not.toContain(secret);
  }
}
