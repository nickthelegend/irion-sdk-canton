'use strict';

// src/client.ts
var DEFAULT_BASE_URL = "https://pay.xorr.finance";
var XorrClient = class {
  constructor(config) {
    if (!config?.clientId || !config?.clientSecret) {
      throw new Error("XorrClient: `clientId` and `clientSecret` are required (get them from the XORR merchant dashboard).");
    }
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.asset = config.asset ?? "USDT";
  }
  /** Create a BNPL checkout session. Returns a `checkoutUrl` to open/redirect the shopper to. */
  async createCheckout(params) {
    if (!params?.amount || params.amount <= 0) throw new Error("XorrClient.createCheckout: `amount` must be > 0");
    const res = await fetch(`${this.baseUrl}/api/bills/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": this.clientId,
        "x-client-secret": this.clientSecret
      },
      body: JSON.stringify({
        amount: params.amount,
        description: params.description,
        asset: params.asset ?? this.asset,
        metadata: { ...params.metadata ?? {}, ...params.orderId ? { orderId: params.orderId } : {} }
      })
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`XORR createCheckout failed (${res.status}): ${detail || res.statusText}`);
    }
    return await res.json();
  }
  /** Fetch the current state of a bill (e.g. to confirm payment server-side). */
  async getBill(billHash) {
    const res = await fetch(`${this.baseUrl}/api/bills/${billHash}`);
    if (!res.ok) throw new Error(`XORR getBill failed (${res.status})`);
    return await res.json();
  }
  /** The checkout URL for a bill hash (if you already have one). */
  checkoutUrl(billHash) {
    return `${this.baseUrl}/pay/${billHash}`;
  }
};

// src/browser.ts
var RESULT_TYPES = ["XORR_PAYMENT_RESULT", "POLARIS_PAYMENT_RESULT"];
function openXorrCheckout(checkoutUrl, options = {}) {
  if (typeof window === "undefined") {
    throw new Error("openXorrCheckout must run in the browser. Create the checkout server-side with XorrClient, then call this on the client.");
  }
  if (options.redirect) {
    window.location.href = checkoutUrl;
    return () => {
    };
  }
  const w = options.width ?? 460;
  const h = options.height ?? 720;
  const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
  const popup = window.open(checkoutUrl, "xorr-checkout", `popup,width=${w},height=${h},left=${left},top=${top}`);
  const handler = (event) => {
    const data = event.data;
    if (!data || !data.type || !RESULT_TYPES.includes(data.type)) return;
    if (data.success) options.onSuccess?.(data);
    else options.onError?.(data);
    cleanup();
  };
  const poll = window.setInterval(() => {
    if (popup && popup.closed) {
      cleanup();
      options.onClose?.();
    }
  }, 600);
  function cleanup() {
    window.removeEventListener("message", handler);
    window.clearInterval(poll);
    try {
      popup?.close();
    } catch {
    }
  }
  window.addEventListener("message", handler);
  return cleanup;
}

exports.XorrClient = XorrClient;
exports.openXorrCheckout = openXorrCheckout;
