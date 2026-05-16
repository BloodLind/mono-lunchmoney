import { describe, expect, it } from "vitest";
import {
  isProviderName,
  PROVIDER_DISPLAY_NAMES,
  PROVIDER_ENV_KEYS,
  PROVIDERS
} from "../../../src/credentials/credential-types.js";

describe("credential types", () => {
  it("defines the supported providers and safe display labels", () => {
    expect(PROVIDERS).toEqual(["monobank", "lunchmoney"]);
    expect(PROVIDER_DISPLAY_NAMES.monobank).toBe("Monobank");
    expect(PROVIDER_ENV_KEYS.lunchmoney).toBe("LUNCHMONEY_TOKEN");
  });

  it("validates provider names", () => {
    expect(isProviderName("monobank")).toBe(true);
    expect(isProviderName("lunchmoney")).toBe(true);
    expect(isProviderName("other")).toBe(false);
  });
});
