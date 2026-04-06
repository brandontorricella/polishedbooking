import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    const { booking_id } = await req.json();
    if (!booking_id) throw new Error("Missing booking_id");

    // Fetch booking with business and service
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("*, business:businesses(*), service:services(*)")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) throw new Error("Booking not found");
    if (booking.client_id !== user.id) throw new Error("Forbidden");

    const business = booking.business;
    const now = new Date();
    const appointmentTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Flexible policy — always free
    if (!business.cancellation_policy || business.cancellation_policy === "flexible") {
      return new Response(
        JSON.stringify({
          fee_applies: false,
          fee_amount: 0,
          deposit_refundable: booking.deposit_paid,
          deposit_forfeited: false,
          message: "Free cancellation",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const feeApplies = hoursUntilAppointment < (business.cancellation_hours || 24);

    let feeAmount = 0;
    let depositForfeited = false;

    if (feeApplies) {
      if (business.cancellation_fee_type === "deposit") {
        feeAmount = 0;
        depositForfeited = booking.deposit_paid;
      } else if (business.cancellation_fee_type === "percentage") {
        feeAmount = (booking.service.price * (business.cancellation_fee_amount || 0)) / 100;
      } else {
        feeAmount = business.cancellation_fee_amount || 0;
      }
    }

    return new Response(
      JSON.stringify({
        fee_applies: feeApplies,
        fee_amount: feeAmount,
        deposit_refundable: !feeApplies && booking.deposit_paid,
        deposit_forfeited: depositForfeited,
        hours_until_appointment: hoursUntilAppointment,
        cancellation_window_hours: business.cancellation_hours || 24,
        deposit_amount: booking.deposit_amount || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error getting cancellation preview:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
