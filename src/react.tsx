import * as React from "react";
import { openXorrCheckout } from "./browser";
import type { PaymentResult } from "./types";

export interface PayWithXorrProps {
  /** A checkout URL already created server-side via `XorrClient.createCheckout`. */
  checkoutUrl?: string;
  /** Or a callback (usually hitting your own backend) that returns a fresh one. */
  createCheckout?: () => Promise<{ checkoutUrl: string }>;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (result: PaymentResult) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Drop-in "Buy Now, Pay Never with XORR" button. Pass a pre-created
 * `checkoutUrl` (recommended) or a `createCheckout` callback.
 *
 * ```tsx
 * <PayWithXorr createCheckout={() => fetch("/api/xorr-checkout", {method:"POST"}).then(r=>r.json())}
 *   onSuccess={(r) => router.push(`/success?tx=${r.txDigest}`)} />
 * ```
 */
export function PayWithXorr({ checkoutUrl, createCheckout, onSuccess, onError, className, style, children }: PayWithXorrProps) {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const url = checkoutUrl ?? (await createCheckout?.())?.checkoutUrl;
      if (!url) throw new Error("PayWithXorr: provide `checkoutUrl` or a `createCheckout` that returns one.");
      openXorrCheckout(url, {
        onSuccess: (r) => { setLoading(false); onSuccess?.(r); },
        onError: (r) => { setLoading(false); onError?.(r); },
        onClose: () => setLoading(false),
      });
    } catch (e) {
      setLoading(false);
      onError?.({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className} style={style}>
      {children ?? (loading ? "Opening XORR…" : "Buy Now, Pay Never — with XORR")}
    </button>
  );
}
