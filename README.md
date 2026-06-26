# @irion/sdk

Drop-in **"Buy Now, Pay Never"** checkout for any merchant or shopping site —
powered by Irion private consumer credit on Stellar. Like a payment-gateway SDK
(Stripe-style): create a checkout on your server with an API key, open it in the
browser, get the result back.

```bash
npm install @irion/sdk
```

> Migrating from `@xorr/sdk`? The old names (`XorrClient`, `openXorrCheckout`,
> `PayWithXorr`, `XorrConfig`) are still exported as deprecated aliases, and the
> `txDigest` field is kept alongside the new `txHash`, so existing code keeps
> working.

## 1. Get your API keys

From the **Irion merchant dashboard** → your App → API credentials, copy:

- `client_id`  → `x-client-id` (public)
- `client_secret` → `x-client-secret` (**secret — server only**)

## 2. Create a checkout (server-side)

`clientSecret` must never reach the browser, so create the session in your
backend (API route / server action / serverless fn):

```ts
import { IrionClient } from "@irion/sdk";

const irion = new IrionClient({
  clientId: process.env.IRION_CLIENT_ID!,
  clientSecret: process.env.IRION_CLIENT_SECRET!,
  // baseUrl: "http://localhost:3001", // self-hosted / local dev; omit for hosted gateway
});

// e.g. inside POST /api/irion-checkout
const { checkoutUrl, billHash } = await irion.createCheckout({
  amount: 49.99,          // in USDC
  orderId: "cart_8842",
  description: "Sneakers x1",
});
return Response.json({ checkoutUrl });
```

## 3. Open the checkout (browser)

### Vanilla JS / any framework

```ts
import { openIrionCheckout } from "@irion/sdk";

const { checkoutUrl } = await fetch("/api/irion-checkout", { method: "POST" }).then(r => r.json());

openIrionCheckout(checkoutUrl, {
  onSuccess: (r) => console.log("paid!", r.txHash, r.loanId),
  onError:   (r) => console.warn("failed", r.error),
  onClose:   () => console.log("shopper closed checkout"),
  // redirect: true,  // full-page redirect instead of a popup
});
```

### React

```tsx
import { PayWithIrion } from "@irion/sdk/react";

<PayWithIrion
  createCheckout={() => fetch("/api/irion-checkout", { method: "POST" }).then(r => r.json())}
  onSuccess={(r) => router.push(`/success?tx=${r.txHash}`)}
/>
```

## How payment works

The shopper picks **Pay Never** (over-collateralized BNPL: their collateral
earns yield that auto-repays the purchase) or pays in full. Their credit is
scored **privately** — income/debts never touch the chain. Settlement happens on
Stellar; you get the `txHash` + `loanId` back.

## Result shape (`postMessage` / callbacks)

```ts
interface PaymentResult {
  success: boolean;
  billHash?: string;
  loanId?: string;     // on-chain BNPL loan id
  txHash?: string;     // Stellar settlement tx (view on stellar.expert)
  txDigest?: string;   // @deprecated legacy alias for txHash (Sui era)
  paymentMode?: "bnpl" | "split3" | "full";
  error?: string;
}
```

## API

| Export | Where | Purpose |
|--------|-------|---------|
| `new IrionClient(config)` | server | `createCheckout(params)`, `getBill(hash)`, `checkoutUrl(hash)` |
| `openIrionCheckout(url, opts)` | browser | opens the checkout popup, resolves via callbacks |
| `<PayWithIrion/>` (`@irion/sdk/react`) | browser | prebuilt button |

MIT.
