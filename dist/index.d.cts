import { X as XorrConfig, C as CreateCheckoutParams, a as Checkout, B as Bill, P as PaymentResult } from './types-Ber6P2tR.cjs';

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
declare class XorrClient {
    private readonly clientId;
    private readonly clientSecret;
    private readonly baseUrl;
    private readonly asset;
    constructor(config: XorrConfig);
    /** Create a BNPL checkout session. Returns a `checkoutUrl` to open/redirect the shopper to. */
    createCheckout(params: CreateCheckoutParams): Promise<Checkout>;
    /** Fetch the current state of a bill (e.g. to confirm payment server-side). */
    getBill(billHash: string): Promise<Bill>;
    /** The checkout URL for a bill hash (if you already have one). */
    checkoutUrl(billHash: string): string;
}

interface OpenCheckoutOptions {
    /** Called when the shopper completes payment. */
    onSuccess?: (result: PaymentResult) => void;
    /** Called on a failed/cancelled payment. */
    onError?: (result: PaymentResult) => void;
    /** Called if the shopper closes the popup without finishing. */
    onClose?: () => void;
    /** Open in the same tab via redirect instead of a popup. */
    redirect?: boolean;
    width?: number;
    height?: number;
}
/**
 * Open the XORR checkout (browser-only) and resolve via callbacks when the
 * shopper finishes. Returns a `cancel()` you can call to tear down listeners.
 *
 * ```ts
 * openXorrCheckout(checkoutUrl, {
 *   onSuccess: (r) => console.log("paid!", r.txDigest),
 *   onError:   (r) => console.warn(r.error),
 * });
 * ```
 */
declare function openXorrCheckout(checkoutUrl: string, options?: OpenCheckoutOptions): () => void;

export { Bill, Checkout, CreateCheckoutParams, type OpenCheckoutOptions, PaymentResult, XorrClient, XorrConfig, openXorrCheckout };
