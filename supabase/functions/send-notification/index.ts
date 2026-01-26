import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-NOTIFICATION] ${step}${detailsStr}`);
};

interface NotificationPayload {
  userId: string;
  type: 'booking_confirmation' | 'booking_reminder' | 'booking_canceled' | 'new_message' | 'promotion';
  title: string;
  message: string;
  data?: Record<string, any>;
}

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
    logStep("Function started");

    const payload: NotificationPayload = await req.json();
    logStep("Received payload", payload);

    if (!payload.userId || !payload.type || !payload.title || !payload.message) {
      throw new Error("Missing required fields: userId, type, title, message");
    }

    // Insert notification into database
    const { data: notification, error } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data || {},
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      logStep("Error inserting notification", { error: error.message });
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    logStep("Notification created", { notificationId: notification.id });

    return new Response(JSON.stringify({ success: true, notification }), {
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
