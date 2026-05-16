import { describe, expect, it } from "vitest";
import { MonobankClient } from "../../../src/monobank/mono-client.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("Monobank statement HTTP client", () => {
  it("sends auth header and parses statement items", async () => {
    let seenHeader = "";
    const client = new MonobankClient("mono-token", {
      baseUrl: "https://mono.test",
      fetchFn: (async (_url, init) => {
        seenHeader = String(new Headers(init?.headers).get("X-Token"));
        return jsonResponse([{ id: "tx", time: 1, amount: -1 }]);
      }) as typeof fetch
    });

    await expect(client.getStatement("acc", 1, 2)).resolves.toEqual([{ id: "tx", time: 1, amount: -1 }]);
    expect(seenHeader).toBe("mono-token");
  });

  it("sanitizes failed response messages", async () => {
    const client = new MonobankClient("mono-token", {
      fetchFn: (async () => new Response("Authorization Bearer secret 4444333322221111", { status: 429 })) as typeof fetch
    });

    await expect(client.getStatement("acc", 1, 2)).rejects.toThrow(/HTTP 429/);
    await expect(client.getStatement("acc", 1, 2)).rejects.not.toThrow(/4444333322221111/);
  });
});
