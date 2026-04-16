import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user?.email) throw new Error("Not authenticated");

    const { booking_id, business_id, amount, provider, service_name } = await req.json();
    const validProviders = ["afterpay_clearpay", "klarna", "affirm"];
    if (!validProviders.includes(provider)) throw new Error("Invalid BNPL provider");
    if (!booking_id || !amount) throw new Error("Missing booking_id or amount");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "https://polishedbooking.com";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: [provider as any],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: service_name || "Service booking" },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/bookings?bnpl_success=1&booking=${booking_id}`,
      cancel_url: `${origin}/bookings?bnpl_canceled=1&booking=${booking_id}`,
      metadata: { booking_id, business_id, user_id: user.id, type: "bnpl_booking", provider },
    });

    await supabaseAdmin.from("payment_transactions").insert({
      booking_id,
      user_id: user.id,
      business_id,
      stripe_payment_intent_id: session.id,
      amount,
      type: "bnpl_booking",
      status: "pending",
      description: `BNPL ${provider} checkout`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e: any) {
    console.error("create-bnpl-checkout error", e);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
