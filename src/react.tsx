import * as React from "react";
import { openIrionCheckout } from "./browser";
import type { PaymentResult } from "./types";

export interface PayWithIrionProps {
  /** A checkout URL already created server-side via `IrionClient.createCheckout`. */
  checkoutUrl?: string;
  /** Or a callback (usually hitting your own backend) that returns a fresh one. */
  createCheckout?: () => Promise<{ checkoutUrl: string }>;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (result: PaymentResult) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/** @deprecated Renamed to {@link PayWithIrionProps}. Kept for back-compat. */
export type PayWithXorrProps = PayWithIrionProps;

/**
 * Drop-in "Buy Now, Pay Never with Irion" button. Pass a pre-created
 * `checkoutUrl` (recommended) or a `createCheckout` callback.
 *
 * ```tsx
 * <PayWithIrion createCheckout={() => fetch("/api/irion-checkout", {method:"POST"}).then(r=>r.json())}
 *   onSuccess={(r) => router.push(`/success?tx=${r.txHash}`)} />
 * ```
 */
export function PayWithIrion({ checkoutUrl, createCheckout, onSuccess, onError, className, style, children }: PayWithIrionProps) {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const url = checkoutUrl ?? (await createCheckout?.())?.checkoutUrl;
      if (!url) throw new Error("PayWithIrion: provide `checkoutUrl` or a `createCheckout` that returns one.");
      openIrionCheckout(url, {
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
      {children ?? (loading ? "Opening Irion…" : "Buy Now, Pay Never — with Irion")}
    </button>
  );
}

/** @deprecated Renamed to {@link PayWithIrion}. Kept for back-compat. */
export const PayWithXorr = PayWithIrion;
