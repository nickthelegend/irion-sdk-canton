import { I as IrionConfig, C as CreateCheckoutParams, a as Checkout, B as Bill, P as PaymentResult } from './types-Bk6JSyrl.cjs';
export { X as XorrConfig } from './types-Bk6JSyrl.cjs';

/**
 * Server-side Irion client. Use it in your backend (API route, server action,
 * serverless function) to create checkout sessions — NEVER expose
 * `clientSecret` to the browser.
 *
 * ```ts
 * const irion = new IrionClient({ clientId: process.env.IRION_CLIENT_ID!, clientSecret: process.env.IRION_CLIENT_SECRET! });
 * const { checkoutUrl } = await irion.createCheckout({ amount: 49.99, orderId: "cart_123" });
 * ```
 */
declare class IrionClient {
    private readonly clientId;
    private readonly clientSecret;
    private readonly baseUrl;
    private readonly asset;
    constructor(config: IrionConfig);
    /** Create a BNPL checkout session. Returns a `checkoutUrl` to open/redirect the shopper to. */
    createCheckout(params: CreateCheckoutParams): Promise<Checkout>;
    /** Fetch the current state of a bill (e.g. to confirm payment server-side). */
    getBill(billHash: string): Promise<Bill>;
    /** The checkout URL for a bill hash (if you already have one). */
    checkoutUrl(billHash: string): string;
}
/** @deprecated Renamed to {@link IrionClient}. Kept for back-compat. */
declare const XorrClient: typeof IrionClient;

interface OpenCheckoutOptions {
    /** Called when the shopper completes payment. */
    onSuccess?: (result: PaymentResult) => void;
    /** Called on a failed/cancelled payment. */
    onError?: (result: PaymentResult) => void;
    /** Called if the shopper closes the popup without finishing. */
    onClose?: () => void;
    /** Open in the same tab via redirect instead of a popup. */
    redirect?: boolean;
    /** Only accept payment-result messages from this exact origin. Defaults to the checkout URL's origin. */
    allowedOrigin?: string;
    width?: number;
    height?: number;
}
/**
 * Open the Irion checkout (browser-only) and resolve via callbacks when the
 * shopper finishes. Returns a `cancel()` you can call to tear down listeners.
 *
 * ```ts
 * openIrionCheckout(checkoutUrl, {
 *   onSuccess: (r) => console.log("paid!", r.txHash),
 *   onError:   (r) => console.warn(r.error),
 * });
 * ```
 */
declare function openIrionCheckout(checkoutUrl: string, options?: OpenCheckoutOptions): () => void;
/** @deprecated Renamed to {@link openIrionCheckout}. Kept for back-compat. */
declare const openXorrCheckout: typeof openIrionCheckout;

export { Bill, Checkout, CreateCheckoutParams, IrionClient, IrionConfig, type OpenCheckoutOptions, PaymentResult, XorrClient, openIrionCheckout, openXorrCheckout };
