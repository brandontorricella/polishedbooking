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

    const { booking_id, tip_token, tip_amount } = await req.json();
    if (!booking_id || !tip_token || tip_amount == null) {
      throw new Error("Missing booking_id, tip_token, or tip_amount");
    }
    const tipAmt = Math.max(0, Number(tip_amount));

    const { data: booking, error: bErr } = await supabaseAdmin
      .from("bookings")
      .select("*, business:businesses(id, name, owner_id), service:services(name), client:profiles!bookings_client_id_fkey(email, display_name)")
      .eq("id", booking_id)
      .single();

    if (bErr || !booking) throw new Error("Booking not found");
    if (booking.tip_token !== tip_token) throw new Error("Invalid token");
    if (booking.status !== "awaiting_payment") {
      // Idempotency: already processed
      return new Response(JSON.stringify({ success: true, alreadyProcessed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const serviceAmt = Number(booking.final_service_amount || booking.total_price || 0);
    const total = serviceAmt + tipAmt;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    const isBnpl = booking.payment_auth_type === "bnpl_paid";
    const updates: any = {
      tip_amount: tipAmt,
      tip_collected: tipAmt > 0,
      tip_submitted_at: new Date().toISOString(),
      total_price: total,
      tip_token: null, // invalidate token
    };

    if (isBnpl) {
      // BNPL was charged at booking for service amount; tip charged separately to saved card if present
      // For now: mark complete (tip can't easily be charged back to BNPL provider)
      updates.status = "completed";
      updates.payment_captured_at = new Date().toISOString();
    } else if (booking.payment_method_id && booking.stripe_customer_id) {
      try {
        const pi = await stripe.paymentIntents.create({
          amount: Math.round(total * 100),
          currency: "usd",
          customer: booking.stripe_customer_id,
          payment_method: booking.payment_method_id,
          off_session: true,
          confirm: true,
          description: `Service: ${(booking.service as any)?.name || "Appointment"}${tipAmt > 0 ? ` + $${tipAmt.toFixed(2)} tip` : ""}`,
          metadata: { booking_id, business_id: (booking.business as any).id, tip: String(tipAmt) },
        });
        updates.payment_capture_intent_id = pi.id;
        updates.payment_captured_at = new Date().toISOString();
        updates.status = "completed";
      } catch (chargeErr: any) {
        console.error("charge failed", chargeErr);
        return new Response(
          JSON.stringify({ error: "Payment could not be processed. Please contact the business.", details: chargeErr.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
        );
      }
    } else {
      // No payment method on file
      updates.status = "completed";
    }

    await supabaseAdmin.from("bookings").update(updates).eq("id", booking_id);

    // Staff commission (service amount + tip)
    if (updates.status === "completed") {
      await recordStaffCommission(supabaseAdmin, {
        bookingId: booking_id,
        businessId: (booking.business as any).id,
        serviceAmount: serviceAmt,
        tipAmount: tipAmt,
      });
    }

    // Receipt email + business notification
    const clientEmail = (booking.client as any)?.email;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (clientEmail && RESEND_API_KEY) {
      const html = `
        <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2>Thank you! 💝</h2>
          <p>Your payment has been processed.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr><td style="padding: 8px 0;">Service</td><td style="text-align: right;">$${serviceAmt.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px 0;">Tip</td><td style="text-align: right;">$${tipAmt.toFixed(2)}</td></tr>
            <tr style="border-top: 1px solid #ddd;"><td style="padding: 12px 0; font-weight: 600;">Total</td><td style="text-align: right; font-weight: 600;">$${total.toFixed(2)}</td></tr>
          </table>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">Thanks for booking with ${(booking.business as any).name} on Polished.</p>
        </div>
      `;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Polished <noreply@polishedbooking.com>",
            to: [clientEmail],
            subject: "Payment receipt",
            html,
          }),
        });
      } catch (e) { console.error("receipt email failed", e); }
    }

    // Notify business owner
    const ownerId = (booking.business as any).owner_id;
    if (ownerId) {
      await supabaseAdmin.from("notifications").insert({
        user_id: ownerId,
        type: "payment_collected",
        title: "Payment collected 💰",
        message: `$${total.toFixed(2)} captured${tipAmt > 0 ? ` (incl. $${tipAmt.toFixed(2)} tip)` : ""}.`,
        data: { booking_id, amount: total, tip: tipAmt },
      });
    }

    return new Response(JSON.stringify({ success: true, total, tip: tipAmt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e: any) {
    console.error("submit-tip-and-capture error", e);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
