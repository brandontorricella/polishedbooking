import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-ACCOUNT] ${step}${detailsStr}`);
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
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, email')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      logStep("Profile fetch error", { error: profileError.message });
    }

    const isBusinessUser = profile?.role === 'business';
    logStep("User role determined", { role: profile?.role, isBusinessUser });

    // For business users, ensure email is preserved in trial_usage
    if (isBusinessUser) {
      // Check if email already exists in trial_usage
      const { data: existingTrial } = await supabaseClient
        .from('trial_usage')
        .select('id')
        .eq('email', user.email.toLowerCase())
        .single();

      if (!existingTrial) {
        // Insert into trial_usage to preserve trial history
        await supabaseClient
          .from('trial_usage')
          .insert({
            email: user.email.toLowerCase(),
            user_id: user.id,
          });
        logStep("Trial usage record created for email preservation");
      } else {
        logStep("Trial usage record already exists");
      }

      // Delete all business-related data
      // 1. Get business IDs owned by this user
      const { data: businesses } = await supabaseClient
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id);

      if (businesses && businesses.length > 0) {
        const businessIds = businesses.map(b => b.id);
        logStep("Found businesses to delete", { count: businessIds.length });

        // 2. Delete related data in order (respecting foreign keys)
        // Delete bookings
        await supabaseClient
          .from('bookings')
          .delete()
          .in('business_id', businessIds);
        logStep("Deleted bookings");

        // Delete services
        await supabaseClient
          .from('services')
          .delete()
          .in('business_id', businessIds);
        logStep("Deleted services");

        // Delete reviews
        await supabaseClient
          .from('reviews')
          .delete()
          .in('business_id', businessIds);
        logStep("Deleted reviews");

        // Delete portfolio images
        await supabaseClient
          .from('portfolio_images')
          .delete()
          .in('business_id', businessIds);
        logStep("Deleted portfolio images");

        // Delete promotions
        await supabaseClient
          .from('promotions')
          .delete()
          .in('business_id', businessIds);
        logStep("Deleted promotions");

        // Delete conversations and messages
        const { data: conversations } = await supabaseClient
          .from('conversations')
          .select('id')
          .in('business_id', businessIds);

        if (conversations && conversations.length > 0) {
          const conversationIds = conversations.map(c => c.id);
          await supabaseClient
            .from('messages')
            .delete()
            .in('conversation_id', conversationIds);
          await supabaseClient
            .from('conversations')
            .delete()
            .in('id', conversationIds);
          logStep("Deleted conversations and messages");
        }

        // Delete businesses
        await supabaseClient
          .from('businesses')
          .delete()
          .in('id', businessIds);
        logStep("Deleted businesses");
      }
    } else {
      // For client users, delete their bookings and reviews
      await supabaseClient
        .from('bookings')
        .delete()
        .eq('client_id', user.id);
      logStep("Deleted client bookings");

      await supabaseClient
        .from('reviews')
        .delete()
        .eq('client_id', user.id);
      logStep("Deleted client reviews");

      // Delete conversations where client is participant
      const { data: clientConversations } = await supabaseClient
        .from('conversations')
        .select('id')
        .eq('client_id', user.id);

      if (clientConversations && clientConversations.length > 0) {
        const conversationIds = clientConversations.map(c => c.id);
        await supabaseClient
          .from('messages')
          .delete()
          .in('conversation_id', conversationIds);
        await supabaseClient
          .from('conversations')
          .delete()
          .in('id', conversationIds);
        logStep("Deleted client conversations");
      }
    }

    // Delete notifications
    await supabaseClient
      .from('notifications')
      .delete()
      .eq('user_id', user.id);
    logStep("Deleted notifications");

    // Delete profile
    await supabaseClient
      .from('profiles')
      .delete()
      .eq('user_id', user.id);
    logStep("Deleted profile");

    // Delete user roles
    await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);
    logStep("Deleted user roles");

    // Finally, delete the auth user
    const { error: deleteUserError } = await supabaseClient.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      logStep("Warning: Could not delete auth user", { error: deleteUserError.message });
      // Continue anyway - data is deleted
    } else {
      logStep("Deleted auth user");
    }

    logStep("Account deletion complete");

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Account and all associated data deleted successfully',
      emailPreserved: isBusinessUser,
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
