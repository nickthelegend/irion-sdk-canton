export { openIrionCheckout, openXorrCheckout } from './chunk-6Y4GUDXC.js';

// src/client.ts
var DEFAULT_BASE_URL = "https://pay.irion.finance";
var IrionClient = class {
  constructor(config) {
    if (!config?.clientId || !config?.clientSecret) {
      throw new Error("IrionClient: `clientId` and `clientSecret` are required (get them from the Irion merchant dashboard).");
    }
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.asset = config.asset ?? "USDC";
  }
  /** Create a BNPL checkout session. Returns a `checkoutUrl` to open/redirect the shopper to. */
  async createCheckout(params) {
    if (!params?.amount || params.amount <= 0) throw new Error("IrionClient.createCheckout: `amount` must be > 0");
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
      throw new Error(`Irion createCheckout failed (${res.status}): ${detail || res.statusText}`);
    }
    return await res.json();
  }
  /** Fetch the current state of a bill (e.g. to confirm payment server-side). */
  async getBill(billHash) {
    const res = await fetch(`${this.baseUrl}/api/bills/${billHash}`);
    if (!res.ok) throw new Error(`Irion getBill failed (${res.status})`);
    return await res.json();
  }
  /** The checkout URL for a bill hash (if you already have one). */
  checkoutUrl(billHash) {
    return `${this.baseUrl}/pay/${billHash}`;
  }
};
var XorrClient = IrionClient;

export { IrionClient, XorrClient };
