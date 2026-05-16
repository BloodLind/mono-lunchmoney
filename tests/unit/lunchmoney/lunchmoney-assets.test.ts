import { describe, expect, it } from "vitest";
import { LunchMoneyV1Client } from "../../../src/lunchmoney/lunchmoney-v1-client.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("Lunch Money assets adapter", () => {
  it("lists manual assets", async () => {
    const client = new LunchMoneyV1Client("token", {
      fetchFn: (async () => jsonResponse({ assets: [{ id: 1, name: "Mono", currency: "uah", type_name: "cash" }] })) as typeof fetch
    });

    await expect(client.listAccounts()).resolves.toEqual([
      { id: 1, name: "Mono", currency: "uah", typeName: "cash", institutionName: undefined, balance: undefined }
    ]);
  });

  it("creates manual assets", async () => {
    let body: unknown;
    const client = new LunchMoneyV1Client("token", {
      fetchFn: (async (_url, init) => {
        body = JSON.parse(String(init?.body));
        return jsonResponse({ id: 2, name: "Created", currency: "uah", type_name: "cash" });
      }) as typeof fetch
    });

    const created = await client.createAccount({
      name: "Created",
      currency: "uah",
      balance: "10.00",
      typeName: "cash",
      institutionName: "Monobank"
    });

    expect(body).toMatchObject({ name: "Created", currency: "uah", type_name: "cash" });
    expect(created.id).toBe(2);
  });
});
