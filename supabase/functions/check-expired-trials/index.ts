import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("[CHECK-EXPIRED-TRIALS] Starting daily check");

    // Find businesses with expired trials that are still visible
    const now = new Date().toISOString();
    const { data: expiredBusinesses, error: fetchError } = await supabase
      .from("businesses")
      .select("id, owner_id, name, trial_ends_at, subscription_status")
      .eq("subscription_status", "trialing")
      .eq("is_publicly_visible", true)
      .lt("trial_ends_at", now);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);

    console.log(`[CHECK-EXPIRED-TRIALS] Found ${expiredBusinesses?.length ?? 0} expired trials`);

    if (!expiredBusinesses || expiredBusinesses.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    for (const biz of expiredBusinesses) {
      // Check they don't have an active subscription (belt-and-suspenders)
      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          is_publicly_visible: false,
          is_published: false,
          unlisted_reason: "trial_expired",
          unlisted_at: now,
          subscription_status: "past_due",
        })
        .eq("id", biz.id)
        .neq("unlisted_reason", "suspended"); // Don't overwrite admin suspensions

      if (updateError) {
        console.error(`[CHECK-EXPIRED-TRIALS] Failed to unlist ${biz.id}: ${updateError.message}`);
        continue;
      }

      // Send notification to the business owner
      await supabase.from("notifications").insert({
        user_id: biz.owner_id,
        type: "subscription",
        title: "⏰ Trial Ended — Listing Paused",
        message: "Your free trial has expired. Subscribe to a plan to restore your listing and continue reaching new clients.",
      });

      processed++;
      console.log(`[CHECK-EXPIRED-TRIALS] Unlisted business ${biz.id} (${biz.name})`);
    }

    console.log(`[CHECK-EXPIRED-TRIALS] Done. Processed ${processed} businesses.`);

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[CHECK-EXPIRED-TRIALS] ERROR: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
