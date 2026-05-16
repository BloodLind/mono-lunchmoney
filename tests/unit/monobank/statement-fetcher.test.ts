import { describe, expect, it } from "vitest";
import { fetchAllStatementItems } from "../../../src/monobank/statement-fetcher.js";
import { fakeStatementClient, monoStatementItem } from "../../fixtures/providers.js";

describe("Monobank statement fetcher", () => {
  it("rejects windows longer than 31 days plus 1 hour", async () => {
    const client = fakeStatementClient([]);
    await expect(fetchAllStatementItems(client, "acc", 0, 32 * 24 * 60 * 60)).rejects.toThrow(
      /31 days/
    );
  });

  it("pages when exactly 500 items are returned, dedupes, and waits between calls", async () => {
    const first = Array.from({ length: 500 }, (_, index) =>
      monoStatementItem({ id: `tx-${index}`, time: 1000 - index })
    );
    const second = [monoStatementItem({ id: "tx-1", time: 900 }), monoStatementItem({ id: "tx-501", time: 899 })];
    const client = fakeStatementClient([first, second]);
    let waits = 0;

    const items = await fetchAllStatementItems(client, "acc", 0, 1000, {
      rateLimiter: { waitTurn: async () => void (waits += 1) }
    });

    expect(client.calls).toHaveLength(2);
    expect(waits).toBe(2);
    expect(items).toHaveLength(501);
  });
});
