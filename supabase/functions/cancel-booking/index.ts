import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user) throw new Error("User not authenticated");

    const { booking_id, reason, canceled_by } = await req.json();
    if (!booking_id) throw new Error("Missing booking_id");

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("*, business:businesses(*), service:services(*)")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) throw new Error("Booking not found");
    if (booking.status === "canceled") throw new Error("Already canceled");

    const business = booking.business;
    const isBusinessCanceling = canceled_by === "business" && business.owner_id === user.id;
    const isClientCanceling = booking.client_id === user.id;

    if (!isBusinessCanceling && !isClientCanceling) {
      throw new Error("Forbidden");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const now = new Date();
    const appointmentTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let cancellationFee = 0;
    let depositRefunded = false;

    if (isBusinessCanceling) {
      // Business cancels: always refund deposit
      if (booking.deposit_paid && booking.deposit_payment_intent_id) {
        try {
          await stripe.refunds.create({ payment_intent: booking.deposit_payment_intent_id });
          depositRefunded = true;
          await supabaseAdmin.from("payment_transactions").insert({
            booking_id,
            user_id: booking.client_id,
            business_id: business.id,
            amount: booking.deposit_amount,
            type: "refund",
            status: "succeeded",
            description: "Deposit refunded - business canceled",
          });
        } catch (e) {
          console.error("Refund error:", e);
        }
      }
    } else {
      // Client cancels
      const feeApplies =
        business.cancellation_policy !== "flexible" &&
        hoursUntilAppointment < (business.cancellation_hours || 24);

      if (feeApplies) {
        if (business.cancellation_fee_type === "percentage") {
          cancellationFee = (booking.service.price * (business.cancellation_fee_amount || 0)) / 100;
        } else if (business.cancellation_fee_type === "fixed") {
          cancellationFee = business.cancellation_fee_amount || 0;
        }
        // deposit type = forfeit deposit, no additional charge
      } else if (booking.deposit_paid && booking.deposit_payment_intent_id) {
        // Free cancellation window — refund deposit
        try {
          await stripe.refunds.create({ payment_intent: booking.deposit_payment_intent_id });
          depositRefunded = true;
          await supabaseAdmin.from("payment_transactions").insert({
            booking_id,
            user_id: user.id,
            business_id: business.id,
            amount: booking.deposit_amount,
            type: "refund",
            status: "succeeded",
            description: "Deposit refunded - free cancellation",
          });
        } catch (e) {
          console.error("Refund error:", e);
        }
      }
    }

    // Update booking
    await supabaseAdmin
      .from("bookings")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        canceled_by: isBusinessCanceling ? "business" : "customer",
        cancellation_reason: reason || null,
        cancellation_fee: cancellationFee,
        cancellation_fee_charged: cancellationFee > 0,
      })
      .eq("id", booking_id);

    // Create notification
    const notifyUserId = isBusinessCanceling ? booking.client_id : business.owner_id;
    const notifyTitle = isBusinessCanceling ? "Appointment Canceled by Business" : "Appointment Canceled";
    const notifyMessage = isBusinessCanceling
      ? `Your appointment at ${business.name} has been canceled. Any deposit will be refunded.`
      : `A client canceled their ${booking.service.name} appointment.`;

    await supabaseAdmin.from("notifications").insert({
      user_id: notifyUserId,
      title: notifyTitle,
      message: notifyMessage,
      type: "booking_canceled",
      data: { booking_id },
    });

    let message = "Booking canceled successfully.";
    if (depositRefunded) {
      message = `Booking canceled. Your $${Number(booking.deposit_amount).toFixed(2)} deposit will be refunded in 5-7 business days.`;
    } else if (cancellationFee > 0) {
      message = `Booking canceled. A $${cancellationFee.toFixed(2)} cancellation fee applies.`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        fee_charged: cancellationFee,
        deposit_refunded: depositRefunded,
        message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error canceling booking:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
