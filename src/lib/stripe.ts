import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Stripe publishable key — safe to expose client-side.
// TODO: Replace with the real publishable key from Stripe dashboard or move to env.
const STRIPE_PUBLISHABLE_KEY =
  'pk_live_51RgK7B2NKCi8B1ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // placeholder fallback

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    const key =
      (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY ||
      STRIPE_PUBLISHABLE_KEY;
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};
