'use strict';

var React = require('react');
var jsxRuntime = require('react/jsx-runtime');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);

// src/react.tsx

// src/browser.ts
var RESULT_TYPES = ["IRION_PAYMENT_RESULT", "XORR_PAYMENT_RESULT", "POLARIS_PAYMENT_RESULT"];
function openIrionCheckout(checkoutUrl, options = {}) {
  if (typeof window === "undefined") {
    throw new Error("openIrionCheckout must run in the browser. Create the checkout server-side with IrionClient, then call this on the client.");
  }
  if (options.redirect) {
    window.location.href = checkoutUrl;
    return () => {
    };
  }
  const expectedOrigin = options.allowedOrigin ?? (() => {
    try {
      return new URL(checkoutUrl).origin;
    } catch {
      return void 0;
    }
  })();
  const w = options.width ?? 460;
  const h = options.height ?? 720;
  const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
  const popup = window.open(checkoutUrl, "irion-checkout", `popup,width=${w},height=${h},left=${left},top=${top}`);
  const handler = (event) => {
    if (expectedOrigin && event.origin !== expectedOrigin) return;
    const data = event.data;
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
    try {
      popup?.close();
    } catch {
    }
  }
  window.addEventListener("message", handler);
  return cleanup;
}
function PayWithIrion({ checkoutUrl, createCheckout, onSuccess, onError, className, style, children }) {
  const [loading, setLoading] = React__namespace.useState(false);
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
  return /* @__PURE__ */ jsxRuntime.jsx("button", { type: "button", onClick: handleClick, disabled: loading, className, style, children: children ?? (loading ? "Opening Irion\u2026" : "Buy Now, Pay Never \u2014 with Irion") });
}
var PayWithXorr = PayWithIrion;

exports.PayWithIrion = PayWithIrion;
exports.PayWithXorr = PayWithXorr;
