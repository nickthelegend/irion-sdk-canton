import * as React from 'react';
import { P as PaymentResult } from './types-Bk6JSyrl.js';

interface PayWithIrionProps {
    /** A checkout URL already created server-side via `IrionClient.createCheckout`. */
    checkoutUrl?: string;
    /** Or a callback (usually hitting your own backend) that returns a fresh one. */
    createCheckout?: () => Promise<{
        checkoutUrl: string;
    }>;
    onSuccess?: (result: PaymentResult) => void;
    onError?: (result: PaymentResult) => void;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}
/** @deprecated Renamed to {@link PayWithIrionProps}. Kept for back-compat. */
type PayWithXorrProps = PayWithIrionProps;
/**
 * Drop-in "Buy Now, Pay Never with Irion" button. Pass a pre-created
 * `checkoutUrl` (recommended) or a `createCheckout` callback.
 *
 * ```tsx
 * <PayWithIrion createCheckout={() => fetch("/api/irion-checkout", {method:"POST"}).then(r=>r.json())}
 *   onSuccess={(r) => router.push(`/success?tx=${r.txHash}`)} />
 * ```
 */
declare function PayWithIrion({ checkoutUrl, createCheckout, onSuccess, onError, className, style, children }: PayWithIrionProps): React.JSX.Element;
/** @deprecated Renamed to {@link PayWithIrion}. Kept for back-compat. */
declare const PayWithXorr: typeof PayWithIrion;

export { PayWithIrion, type PayWithIrionProps, PayWithXorr, type PayWithXorrProps };
