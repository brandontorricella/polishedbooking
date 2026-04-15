import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIER_PRICES: Record<string, Record<string, string>> = {
  basic: {
    monthly: "price_1TMBwDKGB55HVIvLRqmAeNjj",
    annual: "price_1TMBweKGB55HVIvL9iIiMxZz",
  },
  pro: {
    monthly: "price_1TMBwuKGB55HVIvLRRAPR0xG",
    annual: "price_1TMBxDKGB55HVIvLAuTtBq8R",
  },
  elite: {
    monthly: "price_1TMBxSKGB55HVIvLWLwTkKvY",
    annual: "price_1TMBxlKGB55HVIvLdKMDNBWp",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { tier, billing } = await req.json();
    const interval = billing || "monthly";
    const priceId = TIER_PRICES[tier]?.[interval];
    if (!priceId) throw new Error(`Invalid tier/billing: ${tier}/${interval}`);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://polishedbooking.com";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/business/analytics?success=true`,
      cancel_url: `${origin}/business/pricing`,
      subscription_data: {
        trial_period_days: 30,
        metadata: { user_id: user.id, tier, billing: interval },
      },
      metadata: { user_id: user.id, tier, billing: interval },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
