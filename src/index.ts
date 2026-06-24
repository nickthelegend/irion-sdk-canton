export { XorrClient } from "./client";
export { openXorrCheckout } from "./browser";
export type { OpenCheckoutOptions } from "./browser";
export type {
  XorrConfig,
  CreateCheckoutParams,
  Checkout,
  Bill,
  PaymentResult,
} from "./types";

// React entry is published separately at "@xorr/sdk/react" to keep React an
// optional peer dependency for non-React (vanilla JS / Vue / server) consumers.
