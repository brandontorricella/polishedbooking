import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { recordStaffCommission } from "../_shared/commission.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

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
    if (!user) throw new Error("Not authenticated");

    const { booking_id, final_amount, send_tip_request } = await req.json();
    if (!booking_id || final_amount == null) throw new Error("Missing booking_id or final_amount");

    // Verify business owner
    const { data: booking, error: bErr } = await supabaseAdmin
      .from("bookings")
      .select("*, business:businesses(id, name, owner_id, tip_presets, tips_enabled), service:services(name), client:profiles!bookings_client_id_fkey(email, display_name)")
      .eq("id", booking_id)
      .single();

    if (bErr || !booking) throw new Error("Booking not found");
    const biz: any = booking.business;
    if (biz.owner_id !== user.id) throw new Error("Not authorized");

    const tipsEnabled = biz.tips_enabled !== false && send_tip_request;
    const isBnpl = booking.payment_auth_type === "bnpl_paid";

    const updates: any = {
      final_service_amount: Number(final_amount),
    };

    if (tipsEnabled && !isBnpl) {
      // Card flow with tips: enter awaiting_payment, send tip request
      const tipToken = generateToken();
      updates.status = "awaiting_payment";
      updates.tip_token = tipToken;
      updates.tip_request_sent_at = new Date().toISOString();
    } else {
      // No tip request OR BNPL (already paid): capture immediately
      if (!isBnpl && booking.payment_method_id && booking.stripe_customer_id) {
        // Capture the saved card
        const Stripe = (await import("https://esm.sh/stripe@18.5.0")).default;
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
        try {
          const pi = await stripe.paymentIntents.create({
            amount: Math.round(Number(final_amount) * 100),
            currency: "usd",
            customer: booking.stripe_customer_id,
            payment_method: booking.payment_method_id,
            off_session: true,
            confirm: true,
            description: `Service: ${(booking.service as any)?.name || "Appointment"}`,
            metadata: { booking_id, business_id: biz.id },
          });
          updates.payment_capture_intent_id = pi.id;
          updates.payment_captured_at = new Date().toISOString();
          updates.status = "completed";
        } catch (chargeErr: any) {
          console.error("charge failed at completion", chargeErr);
          // Mark awaiting_payment so business can retry
          updates.status = "awaiting_payment";
        }
      } else {
        // BNPL already paid OR no card on file: just mark completed
        updates.status = "completed";
        if (isBnpl) {
          updates.payment_captured_at = new Date().toISOString();
        }
      }
    }

    const { error: updErr } = await supabaseAdmin
      .from("bookings")
      .update(updates)
      .eq("id", booking_id);
    if (updErr) throw updErr;

    // Record staff commission if booking is now completed (not for awaiting_payment - tip will trigger it later)
    if (updates.status === "completed") {
      await recordStaffCommission(supabaseAdmin, {
        bookingId: booking_id,
        businessId: biz.id,
        serviceAmount: Number(final_amount),
        tipAmount: 0,
      });
    }

    // If tip request was sent, notify client (in-app + email)
    if (tipsEnabled && !isBnpl && updates.tip_token) {
      const clientEmail = (booking.client as any)?.email;
      const clientName = (booking.client as any)?.display_name || "there";
      const origin = req.headers.get("origin") || "https://polishedbooking.com";
      const tipUrl = `${origin}/tip/${booking_id}?token=${updates.tip_token}`;

      // In-app notification
      await supabaseAdmin.from("notifications").insert({
        user_id: booking.client_id,
        type: "tip_request",
        title: "How was your appointment?",
        message: `Your visit with ${biz.name} is complete. Add a tip for your provider.`,
        data: { booking_id, tip_url: tipUrl },
      });

      // Email
      if (clientEmail) {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (RESEND_API_KEY) {
          const html = `
            <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #000;">Your appointment is complete 💝</h2>
              <p>Hi ${clientName},</p>
              <p>Thanks for visiting <strong>${biz.name}</strong>! Your service total is <strong>$${Number(final_amount).toFixed(2)}</strong>.</p>
              <p>Would you like to add a tip for your provider before we charge your card on file?</p>
              <p style="margin: 32px 0;">
                <a href="${tipUrl}" style="background: #000; color: #fff; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: 600;">
                  Add a tip & complete payment
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">If you don't respond within 24 hours, we'll automatically charge the service amount with no tip.</p>
            </div>
          `;
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Polished <noreply@polishedbooking.com>",
                to: [clientEmail],
                subject: `Your appointment is complete — add a tip?`,
                html,
              }),
            });
          } catch (emailErr) {
            console.error("Email send failed", emailErr);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, status: updates.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e: any) {
    console.error("complete-appointment error", e);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
