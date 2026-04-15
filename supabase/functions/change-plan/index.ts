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

const TIER_ORDER: Record<string, number> = { basic: 1, pro: 2, elite: 3 };

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHANGE-PLAN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { new_tier, billing } = await req.json();
    const interval = billing || "monthly";
    if (!["basic", "pro", "elite"].includes(new_tier)) {
      throw new Error("Invalid subscription tier");
    }

    const newPriceId = TIER_PRICES[new_tier]?.[interval];
    if (!newPriceId) throw new Error(`Price ID not configured for tier: ${new_tier}/${interval}`);
    logStep("Target tier", { new_tier, interval, newPriceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, creating checkout session");
      const origin = req.headers.get("origin") || "https://polishedbooking.com";
      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        line_items: [{ price: newPriceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${origin}/business/analytics?success=true&plan=${new_tier}`,
        cancel_url: `${origin}/business/analytics?canceled=true`,
        subscription_data: {
          metadata: { user_id: user.id, tier: new_tier, billing: interval },
        },
        metadata: { user_id: user.id, tier: new_tier, billing: interval },
      });
      return new Response(JSON.stringify({ checkout_url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active/trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    let activeSub = subscriptions.data[0];
    if (!activeSub) {
      const trialingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
      activeSub = trialingSubs.data[0];
    }

    if (!activeSub) {
      logStep("No active subscription, creating checkout session");
      const origin = req.headers.get("origin") || "https://polishedbooking.com";
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: newPriceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${origin}/business/analytics?success=true&plan=${new_tier}`,
        cancel_url: `${origin}/business/analytics?canceled=true`,
        metadata: { user_id: user.id, tier: new_tier, billing: interval },
      });
      return new Response(JSON.stringify({ checkout_url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Determine current tier from subscription metadata or price
    const currentTier = activeSub.metadata?.tier || "basic";
    if (currentTier === new_tier) {
      return new Response(JSON.stringify({ error: "You are already on this plan" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const isUpgrade = (TIER_ORDER[new_tier] || 0) > (TIER_ORDER[currentTier] || 0);
    logStep("Plan change", { currentTier, new_tier, isUpgrade });

    // Update existing subscription
    const subscriptionItemId = activeSub.items.data[0].id;
    const updatedSubscription = await stripe.subscriptions.update(activeSub.id, {
      items: [{
        id: subscriptionItemId,
        price: newPriceId,
      }],
      proration_behavior: isUpgrade ? "create_prorations" : "none",
      metadata: { ...activeSub.metadata, tier: new_tier, billing: interval },
    });
    logStep("Subscription updated", { subscriptionId: updatedSubscription.id });

    // Update business in database
    const { error: dbError } = await supabaseClient
      .from("businesses")
      .update({
        subscription_tier: new_tier,
        updated_at: new Date().toISOString(),
      })
      .eq("owner_id", user.id);

    if (dbError) {
      logStep("DB update warning", { error: dbError.message });
    }

    const message = isUpgrade
      ? `Upgraded to ${new_tier}! Your card will be charged the prorated difference.`
      : `Switched to ${new_tier}. Changes take effect immediately.`;

    return new Response(JSON.stringify({
      success: true,
      message,
      new_tier,
      is_upgrade: isUpgrade,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
