import type { PaymentResult } from "./types";

export interface OpenCheckoutOptions {
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

// Accept the new IRION result type, plus XORR/POLARIS for back-compat with
// older Irion cores.
const RESULT_TYPES = ["IRION_PAYMENT_RESULT", "XORR_PAYMENT_RESULT", "POLARIS_PAYMENT_RESULT"];

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
export function openIrionCheckout(checkoutUrl: string, options: OpenCheckoutOptions = {}): () => void {
  if (typeof window === "undefined") {
    throw new Error("openIrionCheckout must run in the browser. Create the checkout server-side with IrionClient, then call this on the client.");
  }
  if (options.redirect) {
    window.location.href = checkoutUrl;
    return () => {};
  }

  const expectedOrigin = options.allowedOrigin ?? (() => { try { return new URL(checkoutUrl).origin } catch { return undefined } })();

  const w = options.width ?? 460;
  const h = options.height ?? 720;
  const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
  const popup = window.open(checkoutUrl, "irion-checkout", `popup,width=${w},height=${h},left=${left},top=${top}`);

  const handler = (event: MessageEvent) => {
    if (expectedOrigin && event.origin !== expectedOrigin) return;
    const data = event.data as PaymentResult & { type?: string };
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
    try { popup?.close(); } catch { /* ignore */ }
  }

  window.addEventListener("message", handler);
  return cleanup;
}

/** @deprecated Renamed to {@link openIrionCheckout}. Kept for back-compat. */
export const openXorrCheckout = openIrionCheckout;
