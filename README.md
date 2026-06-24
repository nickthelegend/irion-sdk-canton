# @xorr/sdk

Drop-in **"Buy Now, Pay Never"** checkout for any merchant or shopping site —
powered by XORR private consumer credit on Sui. Like a payment-gateway SDK
(Stripe-style): create a checkout on your server with an API key, open it in the
browser, get the result back.

```bash
npm install @xorr/sdk
```

## 1. Get your API keys

From the **XORR merchant dashboard** → your App → API credentials, copy:

- `client_id`  → `x-client-id` (public)
- `client_secret` → `x-client-secret` (**secret — server only**)

## 2. Create a checkout (server-side)

`clientSecret` must never reach the browser, so create the session in your
backend (API route / server action / serverless fn):

```ts
import { XorrClient } from "@xorr/sdk";

const xorr = new XorrClient({
  clientId: process.env.XORR_CLIENT_ID!,
  clientSecret: process.env.XORR_CLIENT_SECRET!,
  // baseUrl: "http://localhost:3001", // self-hosted / local dev; omit for hosted gateway
});

// e.g. inside POST /api/xorr-checkout
const { checkoutUrl, billHash } = await xorr.createCheckout({
  amount: 49.99,          // in USDC
  orderId: "cart_8842",
  description: "Sneakers x1",
});
return Response.json({ checkoutUrl });
```

## 3. Open the checkout (browser)

### Vanilla JS / any framework

```ts
import { openXorrCheckout } from "@xorr/sdk";

const { checkoutUrl } = await fetch("/api/xorr-checkout", { method: "POST" }).then(r => r.json());

openXorrCheckout(checkoutUrl, {
  onSuccess: (r) => console.log("paid!", r.txDigest, r.loanId),
  onError:   (r) => console.warn("failed", r.error),
  onClose:   () => console.log("shopper closed checkout"),
  // redirect: true,  // full-page redirect instead of a popup
});
```

### React

```tsx
import { PayWithXorr } from "@xorr/sdk/react";

<PayWithXorr
  createCheckout={() => fetch("/api/xorr-checkout", { method: "POST" }).then(r => r.json())}
  onSuccess={(r) => router.push(`/success?tx=${r.txDigest}`)}
/>
```

## How payment works

The shopper picks **Pay Never** (over-collateralized BNPL: their collateral
earns DeepBook yield that auto-repays the purchase) or pays in full. Their
credit is scored **privately inside a TEE** — income/debts never touch the
chain. Settlement happens on Sui; you get the `txDigest` + `loanId` back.

## Result shape (`postMessage` / callbacks)

```ts
interface PaymentResult {
  success: boolean;
  billHash?: string;
  loanId?: string;     // on-chain BNPL loan object id
  txDigest?: string;   // Sui settlement tx (view on suiscan.xyz)
  paymentMode?: "bnpl" | "split3" | "full";
  error?: string;
}
```

## API

| Export | Where | Purpose |
|--------|-------|---------|
| `new XorrClient(config)` | server | `createCheckout(params)`, `getBill(hash)`, `checkoutUrl(hash)` |
| `openXorrCheckout(url, opts)` | browser | opens the checkout popup, resolves via callbacks |
| `<PayWithXorr/>` (`@xorr/sdk/react`) | browser | prebuilt button |

MIT.
