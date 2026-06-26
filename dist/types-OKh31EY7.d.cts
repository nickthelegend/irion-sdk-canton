/** Configuration for the server-side {@link IrionClient}. Get your keys from
 * the Irion merchant dashboard (Apps → API credentials). */
interface IrionConfig {
    /** `x-client-id` — your public merchant app id (e.g. `prod_...`). */
    clientId: string;
    /** `x-client-secret` — KEEP SERVER-SIDE ONLY. Never ship to the browser. */
    clientSecret: string;
    /** Irion API base URL. Defaults to the hosted gateway; point at your
     * self-hosted Irion core/merchant deployment in dev (e.g. http://localhost:3001). */
    baseUrl?: string;
    /** Settlement asset. Defaults to `USDC`. */
    asset?: string;
}
/** @deprecated Renamed to {@link IrionConfig}. Kept for back-compat. */
type XorrConfig = IrionConfig;
interface CreateCheckoutParams {
    /** Amount due, in whole `asset` units (e.g. 49.99 USDC). */
    amount: number;
    /** Your order/cart id — echoed back in the payment result. */
    orderId?: string;
    /** Human-readable description shown on the checkout. */
    description?: string;
    /** Arbitrary metadata stored on the bill. */
    metadata?: Record<string, unknown>;
    /** Override the default asset for this checkout. */
    asset?: string;
}
interface Checkout {
    billId?: string;
    /** Unique bill hash; the checkout lives at `{baseUrl}/pay/{billHash}`. */
    billHash: string;
    /** URL to open/redirect the shopper to in order to pay. */
    checkoutUrl: string;
    merchantName?: string;
    status: string;
}
interface Bill {
    billHash: string;
    amount: number;
    asset: string;
    description?: string;
    status: "pending" | "paid" | "expired" | string;
    metadata?: Record<string, unknown>;
}
/** Posted back to `window.opener` (and resolved by {@link openIrionCheckout}) when
 * the shopper finishes the Irion checkout. */
interface PaymentResult {
    success: boolean;
    billHash?: string;
    /** On-chain BNPL loan id (if the shopper chose Pay-Never / BNPL). */
    loanId?: string;
    /** Stellar transaction hash of the settlement. */
    txHash?: string;
    /** @deprecated Use {@link PaymentResult.txHash}. Legacy alias from the Sui era. */
    txDigest?: string;
    paymentMode?: "bnpl" | "split3" | "full";
    error?: string;
}

export type { Bill as B, CreateCheckoutParams as C, IrionConfig as I, PaymentResult as P, XorrConfig as X, Checkout as a };
