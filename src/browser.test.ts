import { test } from "node:test";
import assert from "node:assert/strict";
import { openIrionCheckout, openXorrCheckout } from "./browser.ts";

function stubWindow() {
  let handler: any = null;
  const popup = { closed: false, close() { this.closed = true; }, focus() {} };
  (globalThis as any).window = {
    screenX: 0, screenY: 0, outerWidth: 1200, outerHeight: 800,
    location: { href: "" },
    open: (url: string) => { (globalThis as any).window.__opened = url; return popup; },
    addEventListener: (_t: string, h: any) => { handler = h; },
    removeEventListener: () => { handler = null; },
    setInterval: () => 0,
    clearInterval: () => {},
    __fire: (e: any) => handler && handler(e),
    __opened: null as any,
  };
  return () => { delete (globalThis as any).window; };
}

test("opens a popup to the checkout URL and returns a cancel fn", () => {
  const restore = stubWindow();
  const cancel = openIrionCheckout("http://localhost:3004/pay/abc");
  assert.equal((globalThis as any).window.__opened, "http://localhost:3004/pay/abc");
  assert.equal(typeof cancel, "function");
  cancel();
  restore();
});

test("redirect mode navigates the page", () => {
  const restore = stubWindow();
  openIrionCheckout("http://x/pay/h", { redirect: true });
  assert.equal((globalThis as any).window.location.href, "http://x/pay/h");
  restore();
});

test("onSuccess fires for a same-origin IRION_PAYMENT_RESULT", () => {
  const restore = stubWindow();
  let got: any = null;
  openIrionCheckout("http://localhost:3004/pay/abc", { onSuccess: (r) => { got = r; } });
  (globalThis as any).window.__fire({ origin: "http://localhost:3004", data: { type: "IRION_PAYMENT_RESULT", success: true, txHash: "tx1" } });
  assert.equal(got?.txHash, "tx1");
  restore();
});

test("messages from a wrong origin are ignored", () => {
  const restore = stubWindow();
  let called = false;
  openIrionCheckout("http://localhost:3004/pay/abc", { onSuccess: () => { called = true; } });
  (globalThis as any).window.__fire({ origin: "http://evil.example", data: { type: "IRION_PAYMENT_RESULT", success: true } });
  assert.equal(called, false);
  restore();
});

test("throws when run outside a browser", () => {
  delete (globalThis as any).window;
  assert.throws(() => openIrionCheckout("http://x/pay/h"));
});

test("openXorrCheckout is the back-compat alias", () => {
  assert.equal(openXorrCheckout, openIrionCheckout);
});
