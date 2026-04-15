

# Production Configuration Plan

## Overview
Wire up real Stripe price IDs (monthly + annual), update email FROM addresses to `polishedbooking.com`, and replace all hardcoded fallback URLs with the production domain. No functionality changes.

## Technical Details

### 1. Stripe Price IDs — Support Monthly + Annual Billing

Currently, `create-checkout` and `change-plan` edge functions use env-var-based `TIER_PRICES` with only one price per tier. The frontend already tracks `billingInterval` but never passes it to the backend.

**Changes:**

**`supabase/functions/create-checkout/index.ts`**
- Replace `TIER_PRICES` with a hardcoded map of all 6 price IDs:
  ```
  basic_monthly: price_1TMBwDKGB55HVIvLRqmAeNjj
  basic_annual:  price_1TMBweKGB55HVIvL9iIiMxZz
  pro_monthly:   price_1TMBwuKGB55HVIvLRRAPR0xG
  pro_annual:    price_1TMBxDKGB55HVIvLAuTtBq8R
  elite_monthly: price_1TMBxSKGB55HVIvLWLwTkKvY
  elite_annual:  price_1TMBxlKGB55HVIvLdKMDNBWp
  ```
- Accept `{ tier, billing }` from the request body (`billing` defaults to `"monthly"`)
- Look up the correct price ID based on `tier` + `billing`
- Update fallback origin to `https://polishedbooking.com`

**`supabase/functions/change-plan/index.ts`**
- Same price ID map and `billing` parameter support
- Update all fallback origins to `https://polishedbooking.com`

**`supabase/functions/customer-portal/index.ts`**
- Update fallback origin to `https://polishedbooking.com`

**`src/hooks/useSuperwall.tsx`**
- Change `startCheckout` signature to accept `(tier, billing?)` and pass `billing` in the request body

**`src/pages/Pricing.tsx`**
- Pass `billingInterval` when calling `startCheckout`

**`src/pages/Business.tsx`** and **`src/components/subscription/SubscriptionManager.tsx`**
- Pass billing interval where `startCheckout` is called (default to `'monthly'` where no toggle exists)

### 2. Email Configuration — Update FROM Addresses

Update all edge functions that send emails via Resend to use the correct addresses:

**`supabase/functions/send-booking-email/index.ts`**
- Change FROM: `"Polished <noreply@polished.app>"` to `"Polished <noreply@polishedbooking.com>"`
- Add `reply_to: "support@polishedbooking.com"`

**`supabase/functions/send-support-email/index.ts`**
- Change FROM: `"Polished Support <noreply@resend.dev>"` to `"Polished Support <noreply@polishedbooking.com>"`
- Change confirmation FROM: `"Polished <noreply@resend.dev>"` to `"Polished <noreply@polishedbooking.com>"`
- Add `reply_to: "support@polishedbooking.com"` to the confirmation email

### 3. Production URL — Replace Hardcoded Fallbacks

Replace all instances of `https://id-preview--4b68f67f-f99e-438c-a615-c52490432989.lovable.app` with `https://polishedbooking.com` in:
- `create-checkout/index.ts`
- `change-plan/index.ts` (3 occurrences)
- `customer-portal/index.ts`

### 4. Deploy Edge Functions

Deploy all modified edge functions after changes.

### Files Modified
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/change-plan/index.ts`
- `supabase/functions/customer-portal/index.ts`
- `supabase/functions/send-booking-email/index.ts`
- `supabase/functions/send-support-email/index.ts`
- `src/hooks/useSuperwall.tsx`
- `src/pages/Pricing.tsx`
- `src/pages/Business.tsx`
- `src/components/subscription/SubscriptionManager.tsx`

