import { openXorrCheckout } from './chunk-MIZTA242.js';
import * as React from 'react';
import { jsx } from 'react/jsx-runtime';

function PayWithXorr({ checkoutUrl, createCheckout, onSuccess, onError, className, style, children }) {
  const [loading, setLoading] = React.useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      const url = checkoutUrl ?? (await createCheckout?.())?.checkoutUrl;
      if (!url) throw new Error("PayWithXorr: provide `checkoutUrl` or a `createCheckout` that returns one.");
      openXorrCheckout(url, {
        onSuccess: (r) => {
          setLoading(false);
          onSuccess?.(r);
        },
        onError: (r) => {
          setLoading(false);
          onError?.(r);
        },
        onClose: () => setLoading(false)
      });
    } catch (e) {
      setLoading(false);
      onError?.({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  };
  return /* @__PURE__ */ jsx("button", { type: "button", onClick: handleClick, disabled: loading, className, style, children: children ?? (loading ? "Opening XORR\u2026" : "Buy Now, Pay Never \u2014 with XORR") });
}

export { PayWithXorr };
