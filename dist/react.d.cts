import * as React from 'react';
import { P as PaymentResult } from './types-Ber6P2tR.cjs';

interface PayWithXorrProps {
    /** A checkout URL already created server-side via `XorrClient.createCheckout`. */
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
/**
 * Drop-in "Buy Now, Pay Never with XORR" button. Pass a pre-created
 * `checkoutUrl` (recommended) or a `createCheckout` callback.
 *
 * ```tsx
 * <PayWithXorr createCheckout={() => fetch("/api/xorr-checkout", {method:"POST"}).then(r=>r.json())}
 *   onSuccess={(r) => router.push(`/success?tx=${r.txDigest}`)} />
 * ```
 */
declare function PayWithXorr({ checkoutUrl, createCheckout, onSuccess, onError, className, style, children }: PayWithXorrProps): React.JSX.Element;

export { PayWithXorr, type PayWithXorrProps };
