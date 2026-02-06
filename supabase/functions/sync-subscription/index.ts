import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Superwall event types
type SuperwallEventType = 
  | 'trial_started'
  | 'subscription_activated'
  | 'subscription_renewed'
  | 'subscription_canceled'
  | 'subscription_expired'
  | 'trial_expired';

interface SuperwallEvent {
  event_type: SuperwallEventType;
  user_id: string;
  product_id: string;
  tier: 'basic' | 'pro' | 'elite';
  expires_at?: string;
  trial_ends_at?: string;
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

    const event: SuperwallEvent = await req.json();
    logStep("Received event", { type: event.event_type, userId: event.user_id });

    // Map Superwall event to subscription status
    let subscriptionStatus: 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid';
    let isPublished: boolean;

    switch (event.event_type) {
      case 'trial_started':
        subscriptionStatus = 'trialing';
        isPublished = true;
        break;
      case 'subscription_activated':
      case 'subscription_renewed':
        subscriptionStatus = 'active';
        isPublished = true;
        break;
      case 'subscription_canceled':
        subscriptionStatus = 'canceled';
        isPublished = false;
        break;
      case 'subscription_expired':
      case 'trial_expired':
        subscriptionStatus = 'past_due';
        isPublished = false;
        break;
      default:
        throw new Error(`Unknown event type: ${event.event_type}`);
    }

    logStep("Mapped status", { subscriptionStatus, isPublished });

    // Update the business record
    const { data: business, error: updateError } = await supabaseClient
      .from('businesses')
      .update({
        subscription_status: subscriptionStatus,
        subscription_tier: event.tier,
        subscription_ends_at: event.expires_at || null,
        trial_ends_at: event.trial_ends_at || null,
        is_published: isPublished,
      })
      .eq('owner_id', event.user_id)
      .select()
      .single();

    if (updateError) {
      logStep("Update error", { error: updateError.message });
      throw new Error(`Failed to update business: ${updateError.message}`);
    }

    logStep("Business updated", { businessId: business?.id, status: subscriptionStatus });

    // Create notification for the user
    const notificationMessage = getNotificationMessage(event.event_type, event.tier);
    if (notificationMessage) {
      await supabaseClient.from('notifications').insert({
        user_id: event.user_id,
        type: 'subscription',
        title: notificationMessage.title,
        message: notificationMessage.message,
      });
      logStep("Notification created");
    }

    return new Response(JSON.stringify({ 
      success: true,
      businessId: business?.id,
      status: subscriptionStatus,
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

function getNotificationMessage(eventType: SuperwallEventType, tier: string): { title: string; message: string } | null {
  switch (eventType) {
    case 'trial_started':
      return {
        title: 'Trial Started!',
        message: `Your ${tier} plan trial is now active. You have 30 days to explore all features.`,
      };
    case 'subscription_activated':
      return {
        title: 'Subscription Active',
        message: `Your ${tier} subscription is now active. Thank you for your support!`,
      };
    case 'subscription_renewed':
      return {
        title: 'Subscription Renewed',
        message: `Your ${tier} subscription has been renewed successfully.`,
      };
    case 'subscription_canceled':
      return {
        title: 'Subscription Canceled',
        message: 'Your subscription has been canceled. Your business profile will be hidden from clients.',
      };
    case 'subscription_expired':
    case 'trial_expired':
      return {
        title: 'Subscription Expired',
        message: 'Your subscription has expired. Renew now to keep your business visible to clients.',
      };
    default:
      return null;
  }
}
