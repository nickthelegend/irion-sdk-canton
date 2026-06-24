// src/browser.ts
var RESULT_TYPES = ["XORR_PAYMENT_RESULT", "POLARIS_PAYMENT_RESULT"];
function openXorrCheckout(checkoutUrl, options = {}) {
  if (typeof window === "undefined") {
    throw new Error("openXorrCheckout must run in the browser. Create the checkout server-side with XorrClient, then call this on the client.");
  }
  if (options.redirect) {
    window.location.href = checkoutUrl;
    return () => {
    };
  }
  const w = options.width ?? 460;
  const h = options.height ?? 720;
  const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
  const popup = window.open(checkoutUrl, "xorr-checkout", `popup,width=${w},height=${h},left=${left},top=${top}`);
  const handler = (event) => {
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

export { openXorrCheckout };
