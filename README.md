# @xorr-finance/irion-sdk

**Stripe-style drop-in checkout for [Irion](https://github.com/nickthelegend) private credit on Canton.**

Let any store or marketplace accept **"Buy Now, Pay Never"** checkout in minutes. Create a
checkout session on your server with an API key, open it in the browser, and get the settlement
result back — the shopper pays on Irion's hosted `/pay` page and the money settles on the
**Canton Network** to your merchant party. Credit is scored **privately**: the shopper's income
and debts live in a Daml contract only they and the operator can see, never the wider network.

[![npm](https://img.shields.io/npm/v/@xorr-finance/irion-sdk.svg)](https://www.npmjs.com/package/@xorr-finance/irion-sdk)
[![license](https://img.shields.io/npm/l/@xorr-finance/irion-sdk.svg)](#license)

- **Zero-config server client** — one API key pair, one `createCheckout` call.
- **Drop-in browser checkout** — popup or full-page redirect, results delivered over origin-filtered `postMessage`.
- **Optional React component** — `<PayWithIrion/>`, with React kept as an optional peer dependency.
- **TypeScript-first** — ships ESM + CJS + types (built with [tsup](https://tsup.egoist.dev)).

---

## Install

```bash
npm i @xorr-finance/irion-sdk
```

React is an **optional** peer dependency — install it only if you use `<PayWithIrion/>`:

```bash
npm i react   # only needed for @xorr-finance/irion-sdk/react
```

---

## Quick start

Checkout is a two-step handshake: create the session **server-side** (so your secret key never
reaches the browser), then open the returned URL **client-side**.

### 1. Create a checkout on your server

`clientSecret` must stay on the server, so create the session in a backend route, server action,
or serverless function.

```ts
// app/api/irion-checkout/route.ts  (or any backend handler)
import { IrionClient } from "@xorr-finance/irion-sdk";

const irion = new IrionClient({
  clientId: process.env.IRION_CLIENT_ID!,       // x-client-id  (public)
  clientSecret: process.env.IRION_CLIENT_SECRET!, // x-client-secret (SERVER ONLY)
  // baseUrl: "http://localhost:3004",           // self-hosted / local dev; omit for hosted gateway
});

export async function POST() {
  const { checkoutUrl, billHash } = await irion.createCheckout({
    amount: 49.99,            // in USDC (the default settlement asset)
    orderId: "cart_8842",     // your order id — echoed back in the result
    description: "Sneakers x1",
    metadata: { sku: "SNK-001" },
  });

  return Response.json({ checkoutUrl, billHash });
}
```

### 2. Open the checkout in the browser

Fetch the URL from your backend, then hand it to `openIrionCheckout`. It opens a popup and
resolves through your callbacks when the shopper finishes (or closes the window).

```ts
import { openIrionCheckout } from "@xorr-finance/irion-sdk";

const { checkoutUrl } = await fetch("/api/irion-checkout", { method: "POST" }).then((r) => r.json());

const cancel = openIrionCheckout(checkoutUrl, {
  onSuccess: (r) => console.log("paid!", r.txHash, r.loanId, r.paymentMode),
  onError:   (r) => console.warn("failed:", r.error),
  onClose:   ()  => console.log("shopper closed the checkout"),
  // redirect: true, // open in the same tab instead of a popup
});

// optional: tear down the listeners / close the popup early
// cancel();
```

### 3. Or drop in the React button

```tsx
import { PayWithIrion } from "@xorr-finance/irion-sdk/react";

export function Checkout() {
  return (
    <PayWithIrion
      createCheckout={() =>
        fetch("/api/irion-checkout", { method: "POST" }).then((r) => r.json())
      }
      onSuccess={(r) => router.push(`/success?tx=${r.txHash}`)}
      onError={(r) => alert(r.error)}
    >
      Buy Now, Pay Never
    </PayWithIrion>
  );
}
```

---

## How checkout works

```
 your store (server)            your store (client)              Irion
 ─────────────────              ───────────────────              ─────
 IrionClient
   .createCheckout()  ──POST──►  /api/bills/create  ───────────►  merchant bills API
                                  x-client-id / x-client-secret    (creates a bill)
        { checkoutUrl, billHash } ◄──────────────────────────────────────┘
                                       │
 openIrionCheckout(checkoutUrl) ◄──────┘
        │  popup → Irion /pay/{billHash}
        ▼
   shopper picks Direct · BNPL · private Credit
        │
        ▼  settles on Canton to the merchant's party
   postMessage { success, txHash, loanId, paymentMode }
        │  (origin-filtered)
        ▼
   onSuccess(result)
```

1. Your backend calls `createCheckout` → the SDK POSTs to the merchant **bills API** with your
   `x-client-id` / `x-client-secret` headers and gets back a `checkoutUrl` + `billHash`.
2. Your frontend calls `openIrionCheckout(checkoutUrl)` → the shopper lands on Irion's `/pay`
   page and chooses **Direct** (pay in full), **BNPL** (Pay-Never — collateral yield auto-repays
   the purchase), or **private Credit**.
3. The payment **settles on the Canton ledger** to the merchant's party, and the `/pay` page
   posts the result back to your window. `openIrionCheckout` filters by origin and routes it to
   `onSuccess` / `onError`.

> In this monorepo, the demo storefront is **`irion-shopping-app-canton`** and the bills API it
> talks to lives in **`irion-merchant-app-canton`**.

---

## API reference

### `new IrionClient(config)` — server

```ts
interface IrionConfig {
  clientId: string;     // x-client-id  (public merchant app id)
  clientSecret: string; // x-client-secret  (SERVER ONLY — never ship to the browser)
  baseUrl?: string;     // Irion API base URL; defaults to the hosted gateway
  asset?: string;       // default settlement asset (defaults to "USDC")
}
```

| Method | Signature | Description |
|---|---|---|
| `createCheckout` | `(params: CreateCheckoutParams) => Promise<Checkout>` | Creates a checkout session. POSTs to `{baseUrl}/api/bills/create` with the client-id/secret headers. Returns `{ checkoutUrl, billHash, status, ... }`. Throws if `amount <= 0` or the API returns a non-2xx. |
| `getBill` | `(billHash: string) => Promise<Bill>` | Fetches the current state of a bill (e.g. to confirm payment server-side). |
| `checkoutUrl` | `(billHash: string) => string` | Builds the checkout URL (`{baseUrl}/pay/{billHash}`) for a hash you already hold. |

```ts
interface CreateCheckoutParams {
  amount: number;                       // amount due in whole `asset` units, e.g. 49.99
  orderId?: string;                     // your order/cart id — echoed back in the result
  description?: string;                 // human-readable line shown on the checkout
  metadata?: Record<string, unknown>;   // arbitrary data stored on the bill
  asset?: string;                       // override the default asset for this checkout
}

interface Checkout {
  billHash: string;        // the checkout lives at {baseUrl}/pay/{billHash}
  checkoutUrl: string;     // URL to open / redirect the shopper to
  status: string;
  billId?: string;
  merchantName?: string;
}
```

The constructor throws if `clientId` or `clientSecret` is missing.

### `openIrionCheckout(checkoutUrl, options?)` — browser

Opens the Irion checkout and resolves through callbacks. **Returns a `cancel()`** function that
removes the listeners and closes the popup. Throws if called outside a browser (`window`
undefined) — create the checkout server-side with `IrionClient`, then call this on the client.

```ts
function openIrionCheckout(checkoutUrl: string, options?: OpenCheckoutOptions): () => void;

interface OpenCheckoutOptions {
  onSuccess?: (result: PaymentResult) => void; // shopper completed payment
  onError?:   (result: PaymentResult) => void; // failed / cancelled payment
  onClose?:   () => void;                       // popup closed before finishing
  redirect?:  boolean;                          // same-tab redirect instead of a popup
  allowedOrigin?: string;                       // only accept messages from this exact origin
                                                // (defaults to the checkout URL's origin)
  width?:  number;                              // popup width  (default 460)
  height?: number;                             // popup height (default 720)
}
```

Results arrive over `postMessage` and are **origin-filtered** by `allowedOrigin` (or the checkout
URL's origin) before any callback fires:

```ts
interface PaymentResult {
  success: boolean;
  billHash?: string;
  loanId?: string;                            // on-chain BNPL loan id (if Pay-Never / BNPL)
  txHash?: string;                            // Canton settlement id (update id)
  paymentMode?: "bnpl" | "split3" | "full";
  error?: string;
  txDigest?: string;                          // @deprecated legacy alias for txHash
}
```

### `<PayWithIrion/>` — React

Import from the `/react` entry point (keeps React optional for non-React consumers):

```tsx
import { PayWithIrion } from "@xorr-finance/irion-sdk/react";
```

| Prop | Type | Description |
|---|---|---|
| `checkoutUrl` | `string` | A checkout URL already created server-side via `IrionClient.createCheckout`. |
| `createCheckout` | `() => Promise<{ checkoutUrl: string }>` | Or a callback (usually hitting your own backend) that returns a fresh one. |
| `onSuccess` | `(result: PaymentResult) => void` | Fired on a completed payment. |
| `onError` | `(result: PaymentResult) => void` | Fired on a failed/cancelled payment. |
| `className` | `string` | Class for the rendered `<button>`. |
| `style` | `React.CSSProperties` | Inline style for the button. |
| `children` | `React.ReactNode` | Custom button label (defaults to "Buy Now, Pay Never — with Irion"). |

Provide **either** `checkoutUrl` **or** `createCheckout`; the component opens the checkout via
`openIrionCheckout` and manages its own loading state.

---

## Back-compat aliases

Migrating from the old `@xorr/sdk`? The previous names are still exported as **deprecated
aliases**, so existing code keeps working:

| Deprecated | Use instead |
|---|---|
| `XorrClient` | `IrionClient` |
| `openXorrCheckout` | `openIrionCheckout` |
| `PayWithXorr` | `PayWithIrion` |
| `XorrConfig` | `IrionConfig` |

The `PaymentResult.txDigest` field is also kept alongside the current `txHash` for the same reason.

---

## Testing

```bash
npm test
```

**12 tests** (`node:test` via `tsx`, no extra runtime deps) covering:

- **`IrionClient`** — `createCheckout` request headers/body, `amount` validation, error handling on non-2xx responses, and `checkoutUrl` construction.
- **`openIrionCheckout`** — popup open, same-tab `redirect`, `postMessage` success delivery, cross-origin message filtering, and the browser-only guard.

---

## License

MIT
