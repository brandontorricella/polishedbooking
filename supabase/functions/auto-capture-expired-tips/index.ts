import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { recordStaffCommission } from "../_shared/commission.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: expired, error } = await supabaseAdmin
      .from("bookings")
      .select("id, business_id, client_id, payment_method_id, stripe_customer_id, final_service_amount, total_price, payment_auth_type, service:services(name)")
      .eq("status", "awaiting_payment")
      .lt("tip_request_sent_at", cutoff);

    if (error) throw error;
    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    let processed = 0;
    let failed = 0;

    for (const b of expired) {
      const amount = Number((b as any).final_service_amount || (b as any).total_price || 0);
      const updates: any = {
        tip_amount: 0,
        tip_collected: false,
        tip_submitted_at: new Date().toISOString(),
        tip_token: null,
        total_price: amount,
        status: "completed",
      };

      const isBnpl = (b as any).payment_auth_type === "bnpl_paid";
      if (!isBnpl && (b as any).payment_method_id && (b as any).stripe_customer_id) {
        try {
          const pi = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: "usd",
            customer: (b as any).stripe_customer_id,
            payment_method: (b as any).payment_method_id,
            off_session: true,
            confirm: true,
            description: `Service (auto-capture, no tip): ${((b as any).service as any)?.name || "Appointment"}`,
            metadata: { booking_id: b.id, auto_capture: "true" },
          });
          updates.payment_capture_intent_id = pi.id;
          updates.payment_captured_at = new Date().toISOString();
        } catch (e) {
          console.error("auto-capture failed", b.id, e);
          failed++;
          continue;
        }
      } else if (isBnpl) {
        updates.payment_captured_at = new Date().toISOString();
      }

      await supabaseAdmin.from("bookings").update(updates).eq("id", b.id);
      await recordStaffCommission(supabaseAdmin, {
        bookingId: b.id,
        businessId: (b as any).business_id,
        serviceAmount: amount,
        tipAmount: 0,
      });
      processed++;
    }

    return new Response(JSON.stringify({ processed, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e: any) {
    console.error("auto-capture-expired-tips error", e);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
