import type { XorrConfig, CreateCheckoutParams, Checkout, Bill } from "./types";

/** Hosted XORR gateway. Override via `baseUrl` for self-hosted / local dev. */
const DEFAULT_BASE_URL = "https://pay.xorr.finance";

/**
 * Server-side XORR client. Use it in your backend (API route, server action,
 * serverless function) to create checkout sessions — NEVER expose
 * `clientSecret` to the browser.
 *
 * ```ts
 * const xorr = new XorrClient({ clientId: process.env.XORR_CLIENT_ID!, clientSecret: process.env.XORR_CLIENT_SECRET! });
 * const { checkoutUrl } = await xorr.createCheckout({ amount: 49.99, orderId: "cart_123" });
 * ```
 */
export class XorrClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private readonly asset: string;

  constructor(config: XorrConfig) {
    if (!config?.clientId || !config?.clientSecret) {
      throw new Error("XorrClient: `clientId` and `clientSecret` are required (get them from the XORR merchant dashboard).");
    }
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.asset = config.asset ?? "USDC";
  }

  /** Create a BNPL checkout session. Returns a `checkoutUrl` to open/redirect the shopper to. */
  async createCheckout(params: CreateCheckoutParams): Promise<Checkout> {
    if (!params?.amount || params.amount <= 0) throw new Error("XorrClient.createCheckout: `amount` must be > 0");
    const res = await fetch(`${this.baseUrl}/api/bills/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": this.clientId,
        "x-client-secret": this.clientSecret,
      },
      body: JSON.stringify({
        amount: params.amount,
        description: params.description,
        asset: params.asset ?? this.asset,
        metadata: { ...(params.metadata ?? {}), ...(params.orderId ? { orderId: params.orderId } : {}) },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`XORR createCheckout failed (${res.status}): ${detail || res.statusText}`);
    }
    return (await res.json()) as Checkout;
  }

  /** Fetch the current state of a bill (e.g. to confirm payment server-side). */
  async getBill(billHash: string): Promise<Bill> {
    const res = await fetch(`${this.baseUrl}/api/bills/${billHash}`);
    if (!res.ok) throw new Error(`XORR getBill failed (${res.status})`);
    return (await res.json()) as Bill;
  }

  /** The checkout URL for a bill hash (if you already have one). */
  checkoutUrl(billHash: string): string {
    return `${this.baseUrl}/pay/${billHash}`;
  }
}
