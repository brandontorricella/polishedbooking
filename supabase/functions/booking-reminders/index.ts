import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BOOKING-REMINDERS] ${step}${detailsStr}`);
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
    logStep("Function started - checking for upcoming bookings");

    // Get bookings for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: upcomingBookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select(`
        id,
        client_id,
        business_id,
        booking_date,
        booking_time,
        total_price,
        services:service_id (name),
        businesses:business_id (name)
      `)
      .eq('booking_date', tomorrowStr)
      .eq('status', 'confirmed');

    if (bookingsError) {
      logStep("Error fetching bookings", { error: bookingsError.message });
      throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
    }

    logStep("Found upcoming bookings", { count: upcomingBookings?.length || 0 });

    const notificationPromises = (upcomingBookings || []).map(async (booking: any) => {
      const serviceName = booking.services?.name || 'your appointment';
      const businessName = booking.businesses?.name || 'the business';
      
      // Send reminder to client
      const { error: notifError } = await supabaseClient
        .from('notifications')
        .insert({
          user_id: booking.client_id,
          type: 'booking_reminder',
          title: 'Appointment Tomorrow',
          message: `Reminder: You have ${serviceName} at ${businessName} tomorrow at ${booking.booking_time}.`,
          data: {
            booking_id: booking.id,
            business_id: booking.business_id,
            booking_date: booking.booking_date,
            booking_time: booking.booking_time,
          },
        });

      if (notifError) {
        logStep("Error creating notification", { bookingId: booking.id, error: notifError.message });
      } else {
        logStep("Notification sent", { bookingId: booking.id, clientId: booking.client_id });
      }

      return !notifError;
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(Boolean).length;

    logStep("Completed", { totalBookings: upcomingBookings?.length || 0, successfulNotifications: successCount });

    return new Response(JSON.stringify({ 
      success: true, 
      processed: upcomingBookings?.length || 0,
      notifications_sent: successCount,
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
