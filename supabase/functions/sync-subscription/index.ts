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

    let subscriptionStatus: 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid';
    let isPublished: boolean;
    let isPubliclyVisible: boolean;
    let unlistedReason: string | null = null;

    switch (event.event_type) {
      case 'trial_started':
        subscriptionStatus = 'trialing';
        isPublished = true;
        isPubliclyVisible = true;
        break;
      case 'subscription_activated':
      case 'subscription_renewed':
        subscriptionStatus = 'active';
        isPublished = true;
        isPubliclyVisible = true;
        break;
      case 'subscription_canceled':
        subscriptionStatus = 'canceled';
        isPublished = false;
        isPubliclyVisible = false;
        unlistedReason = 'canceled';
        break;
      case 'subscription_expired':
        subscriptionStatus = 'past_due';
        isPublished = false;
        isPubliclyVisible = false;
        unlistedReason = 'past_due';
        break;
      case 'trial_expired':
        subscriptionStatus = 'past_due';
        isPublished = false;
        isPubliclyVisible = false;
        unlistedReason = 'trial_expired';
        break;
      default:
        throw new Error(`Unknown event type: ${event.event_type}`);
    }

    logStep("Mapped status", { subscriptionStatus, isPublished, isPubliclyVisible, unlistedReason });

    // First check the current state to avoid overwriting admin suspensions
    const { data: currentBusiness } = await supabaseClient
      .from('businesses')
      .select('id, is_publicly_visible, unlisted_reason')
      .eq('owner_id', event.user_id)
      .single();

    // Don't relist if admin-suspended
    if (currentBusiness?.unlisted_reason === 'suspended' && isPubliclyVisible) {
      logStep("Skipping relist - business is admin-suspended");
      isPubliclyVisible = false;
      unlistedReason = 'suspended';
    }

    const updateData: Record<string, any> = {
      subscription_status: subscriptionStatus,
      subscription_tier: event.tier,
      subscription_ends_at: event.expires_at || null,
      trial_ends_at: event.trial_ends_at || null,
      is_published: isPublished,
      is_publicly_visible: isPubliclyVisible,
    };

    if (isPubliclyVisible) {
      // Relisting
      updateData.unlisted_reason = null;
      updateData.relisted_at = new Date().toISOString();
    } else if (unlistedReason && currentBusiness?.unlisted_reason !== 'suspended') {
      // Unlisting (not admin-suspended)
      updateData.unlisted_reason = unlistedReason;
      updateData.unlisted_at = new Date().toISOString();
    }

    const { data: business, error: updateError } = await supabaseClient
      .from('businesses')
      .update(updateData)
      .eq('owner_id', event.user_id)
      .select()
      .single();

    if (updateError) {
      logStep("Update error", { error: updateError.message });
      throw new Error(`Failed to update business: ${updateError.message}`);
    }

    logStep("Business updated", { businessId: business?.id, status: subscriptionStatus, visible: isPubliclyVisible });

    // Create notification
    const notificationMessage = getNotificationMessage(event.event_type, event.tier, isPubliclyVisible);
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
      isPubliclyVisible,
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

function getNotificationMessage(eventType: SuperwallEventType, tier: string, isVisible: boolean): { title: string; message: string } | null {
  switch (eventType) {
    case 'trial_started':
      return {
        title: 'Trial Started!',
        message: `Your ${tier} plan trial is now active. You have 30 days to explore all features.`,
      };
    case 'subscription_activated':
      return {
        title: '🎉 Subscription Active — You\'re Live!',
        message: `Your ${tier} subscription is now active and your listing is visible to customers.`,
      };
    case 'subscription_renewed':
      return {
        title: '✅ Subscription Renewed',
        message: `Your ${tier} subscription has been renewed. Your listing remains live.`,
      };
    case 'subscription_canceled':
      return {
        title: '📋 Subscription Canceled — Listing Paused',
        message: 'Your subscription has been canceled. Your listing is hidden from customers but your data is fully preserved. Resubscribe anytime to go live again.',
      };
    case 'subscription_expired':
      return {
        title: '⚠️ Subscription Past Due — Listing Paused',
        message: 'Your subscription payment is overdue. Your listing has been paused. Update your payment method to restore visibility.',
      };
    case 'trial_expired':
      return {
        title: '⏰ Trial Ended — Listing Paused',
        message: 'Your free trial has expired. Subscribe to a plan to restore your listing and continue reaching new clients.',
      };
    default:
      return null;
  }
}
