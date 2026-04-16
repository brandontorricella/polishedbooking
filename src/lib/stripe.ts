import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Stripe publishable key — safe to expose client-side.
// TODO: Replace with the real publishable key from Stripe dashboard or move to env.
const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51S5AGnKGB55HVIvLjqA0eXWv9108527wgWxvbb2UhualuxV3vXd2uMz927JGa9hNS8hRVpLnCtVNpiIavCqerKOy00aO5zbvCF';

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
