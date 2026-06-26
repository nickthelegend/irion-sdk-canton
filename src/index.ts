export { IrionClient, XorrClient } from "./client";
export { openIrionCheckout, openXorrCheckout } from "./browser";
export type { OpenCheckoutOptions } from "./browser";
export type {
  IrionConfig,
  XorrConfig,
  CreateCheckoutParams,
  Checkout,
  Bill,
  PaymentResult,
} from "./types";

// React entry is published separately at "@irion/sdk/react" to keep React an
// optional peer dependency for non-React (vanilla JS / Vue / server) consumers.
