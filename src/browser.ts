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
  width?: number;
  height?: number;
}

const RESULT_TYPES = ["XORR_PAYMENT_RESULT", "POLARIS_PAYMENT_RESULT"];

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
export function openXorrCheckout(checkoutUrl: string, options: OpenCheckoutOptions = {}): () => void {
  if (typeof window === "undefined") {
    throw new Error("openXorrCheckout must run in the browser. Create the checkout server-side with XorrClient, then call this on the client.");
  }
  if (options.redirect) {
    window.location.href = checkoutUrl;
    return () => {};
  }

  const w = options.width ?? 460;
  const h = options.height ?? 720;
  const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
  const popup = window.open(checkoutUrl, "xorr-checkout", `popup,width=${w},height=${h},left=${left},top=${top}`);

  const handler = (event: MessageEvent) => {
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
