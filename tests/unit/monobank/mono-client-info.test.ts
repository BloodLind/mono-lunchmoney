import { describe, expect, it } from "vitest";
import { flattenMonobankSources } from "../../../src/monobank/mono-client.js";
import { monoClientInfo } from "../../fixtures/providers.js";

describe("Monobank client info flattening", () => {
  it("flattens personal and FOP/managed account sources", () => {
    const sources = flattenMonobankSources(
      monoClientInfo({
        clients: [
          {
            name: "FOP Ada",
            accounts: [{ id: "fop-1", type: "fop", currencyCode: 980, balance: 10_000 }]
          }
        ]
      })
    );

    expect(sources).toHaveLength(2);
    expect(sources[0]).toMatchObject({ accountId: "mono-account-1", currency: "uah" });
    expect(sources[1]).toMatchObject({ accountId: "fop-1", isFop: true, type: "fop" });
  });
});
