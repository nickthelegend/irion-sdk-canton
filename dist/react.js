import { openIrionCheckout } from './chunk-6Y4GUDXC.js';
import * as React from 'react';
import { jsx } from 'react/jsx-runtime';

function PayWithIrion({ checkoutUrl, createCheckout, onSuccess, onError, className, style, children }) {
  const [loading, setLoading] = React.useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      const url = checkoutUrl ?? (await createCheckout?.())?.checkoutUrl;
      if (!url) throw new Error("PayWithIrion: provide `checkoutUrl` or a `createCheckout` that returns one.");
      openIrionCheckout(url, {
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
  return /* @__PURE__ */ jsx("button", { type: "button", onClick: handleClick, disabled: loading, className, style, children: children ?? (loading ? "Opening Irion\u2026" : "Buy Now, Pay Never \u2014 with Irion") });
}
var PayWithXorr = PayWithIrion;

export { PayWithIrion, PayWithXorr };
