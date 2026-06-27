import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { IrionClient, XorrClient } from "./client.ts";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

test("constructor requires clientId + clientSecret", () => {
  assert.throws(() => new IrionClient({} as any));
  assert.throws(() => new IrionClient({ clientId: "a" } as any));
});

test("checkoutUrl uses baseUrl and strips trailing slashes", () => {
  const c = new IrionClient({ clientId: "id", clientSecret: "sk", baseUrl: "http://localhost:3004/" });
  assert.equal(c.checkoutUrl("abc"), "http://localhost:3004/pay/abc");
});

test("createCheckout rejects non-positive amounts", async () => {
  const c = new IrionClient({ clientId: "id", clientSecret: "sk" });
  await assert.rejects(() => c.createCheckout({ amount: 0 } as any));
});

test("createCheckout POSTs to /api/bills/create with client headers + body", async () => {
  let captured: any;
  globalThis.fetch = (async (url: any, init: any) => {
    captured = { url, init };
    return { ok: true, json: async () => ({ checkoutUrl: "http://h/pay/x", billHash: "x" }) } as any;
  }) as any;
  const c = new IrionClient({ clientId: "cid", clientSecret: "csek", baseUrl: "http://h" });
  const out = await c.createCheckout({ amount: 49.99, orderId: "cart_1", description: "Sneakers" });
  assert.equal(out.checkoutUrl, "http://h/pay/x");
  assert.equal(captured.url, "http://h/api/bills/create");
  assert.equal(captured.init.method, "POST");
  assert.equal(captured.init.headers["x-client-id"], "cid");
  assert.equal(captured.init.headers["x-client-secret"], "csek");
  const body = JSON.parse(captured.init.body);
  assert.equal(body.amount, 49.99);
  assert.equal(body.metadata.orderId, "cart_1");
});

test("createCheckout throws with status on non-ok responses", async () => {
  globalThis.fetch = (async () => ({ ok: false, status: 402, statusText: "Payment Required", text: async () => "no funds" }) as any) as any;
  const c = new IrionClient({ clientId: "id", clientSecret: "sk" });
  await assert.rejects(() => c.createCheckout({ amount: 5 }), /402/);
});

test("XorrClient is the back-compat alias of IrionClient", () => {
  assert.equal(XorrClient, IrionClient);
});
