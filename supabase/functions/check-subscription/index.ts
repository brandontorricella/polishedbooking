import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIER_PRODUCTS: Record<string, string> = {
  [Deno.env.get("STRIPE_PRODUCT_BASIC") || "prod_basic"]: "basic",
  [Deno.env.get("STRIPE_PRODUCT_PRO") || "prod_pro"]: "pro",
  [Deno.env.get("STRIPE_PRODUCT_ELITE") || "prod_elite"]: "elite",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;

    // Check active or trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    let trialingSubs: Stripe.ApiList<Stripe.Subscription> | null = null;
    if (subscriptions.data.length === 0) {
      trialingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
    }

    const activeSub = subscriptions.data[0] || trialingSubs?.data?.[0];

    if (!activeSub) {
      // Sync to database
      await supabaseClient
        .from("businesses")
        .update({
          subscription_status: "canceled",
          is_published: false,
          stripe_customer_id: customerId,
        })
        .eq("owner_id", user.id);

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productId = activeSub.items.data[0].price.product as string;
    const tier = TIER_PRODUCTS[productId] || "basic";
    const subscriptionEnd = new Date(activeSub.current_period_end * 1000).toISOString();
    const isTrialing = activeSub.status === "trialing";
    const trialEnd = activeSub.trial_end
      ? new Date(activeSub.trial_end * 1000).toISOString()
      : null;

    // Sync to database
    await supabaseClient
      .from("businesses")
      .update({
        subscription_status: isTrialing ? "trialing" : "active",
        subscription_tier: tier,
        subscription_ends_at: subscriptionEnd,
        trial_ends_at: trialEnd,
        is_published: true,
        stripe_customer_id: customerId,
        stripe_subscription_id: activeSub.id,
      })
      .eq("owner_id", user.id);

    return new Response(
      JSON.stringify({
        subscribed: true,
        tier,
        subscription_end: subscriptionEnd,
        is_trialing: isTrialing,
        trial_end: trialEnd,
        status: activeSub.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
