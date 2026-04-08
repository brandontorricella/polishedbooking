import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth check
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get business
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: business } = await adminClient
      .from("businesses")
      .select("id, name, subscription_tier")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!business) {
      return new Response(JSON.stringify({ error: "No business found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate week range (last full Mon-Sun)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - (dayOfWeek === 0 ? 0 : dayOfWeek));
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    // Check if already generated
    const { data: existing } = await adminClient
      .from("ai_insights")
      .select("*")
      .eq("business_id", business.id)
      .eq("week_start", weekStartStr)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify(existing), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather this week's bookings
    const { data: bookings } = await adminClient
      .from("bookings")
      .select("status, total_price, tip_amount, service_id, staff_id, client_id, booking_date, booking_time")
      .eq("business_id", business.id)
      .gte("booking_date", weekStartStr)
      .lte("booking_date", weekEndStr);

    const rows = bookings || [];
    const completed = rows.filter((b) => b.status === "completed");
    const canceled = rows.filter((b) => b.status === "canceled");
    const total = rows.length;
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
    const cancellationRate = total > 0 ? Math.round((canceled.length / total) * 100) : 0;
    const totalRevenue = completed.reduce((s, b) => s + Number(b.total_price || 0), 0);
    const totalTips = completed.reduce((s, b) => s + Number(b.tip_amount || 0), 0);
    const avgBookingValue = completed.length > 0 ? totalRevenue / completed.length : 0;

    // Previous week for comparison
    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    const prevWeekStart = new Date(prevWeekEnd);
    prevWeekStart.setDate(prevWeekEnd.getDate() - 6);

    const { data: prevBookings } = await adminClient
      .from("bookings")
      .select("status, total_price")
      .eq("business_id", business.id)
      .gte("booking_date", prevWeekStart.toISOString().split("T")[0])
      .lte("booking_date", prevWeekEnd.toISOString().split("T")[0])
      .eq("status", "completed");

    const prevCompleted = (prevBookings || []).length;
    const bookingChangePct = prevCompleted > 0
      ? Math.round(((completed.length - prevCompleted) / prevCompleted) * 100)
      : null;

    // Top services
    const serviceCounts: Record<string, { count: number; revenue: number }> = {};
    for (const b of completed) {
      const sid = b.service_id || "unknown";
      if (!serviceCounts[sid]) serviceCounts[sid] = { count: 0, revenue: 0 };
      serviceCounts[sid].count++;
      serviceCounts[sid].revenue += Number(b.total_price || 0);
    }

    // Get service names
    const serviceIds = Object.keys(serviceCounts).filter((id) => id !== "unknown");
    let serviceNames: Record<string, string> = {};
    if (serviceIds.length > 0) {
      const { data: services } = await adminClient
        .from("services")
        .select("id, name")
        .in("id", serviceIds);
      serviceNames = Object.fromEntries((services || []).map((s) => [s.id, s.name]));
    }

    const topServices = Object.entries(serviceCounts)
      .map(([id, val]) => ({ name: serviceNames[id] || "Other", ...val }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // New vs returning
    const uniqueClients = new Set(completed.map((b) => b.client_id));
    let newClients = 0;
    let returningClients = 0;
    for (const clientId of uniqueClients) {
      const { count } = await adminClient
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("client_id", clientId)
        .lt("booking_date", weekStartStr)
        .eq("status", "completed");
      if ((count || 0) > 0) returningClients++;
      else newClients++;
    }

    const dataSnapshot = {
      week: `${weekStartStr} - ${weekEndStr}`,
      total_bookings: total,
      completed: completed.length,
      canceled: canceled.length,
      completion_rate: completionRate,
      cancellation_rate: cancellationRate,
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      total_tips: parseFloat(totalTips.toFixed(2)),
      avg_booking_value: parseFloat(avgBookingValue.toFixed(2)),
      booking_change_pct: bookingChangePct,
      top_services: topServices,
      new_clients: newClients,
      returning_clients: returningClients,
    };

    // Build prompt
    const prompt = `You are a helpful business advisor for a beauty and wellness business called "${business.name}".
Analyze this week's performance data and write a brief, encouraging, plain-English summary with 3-5 actionable insights.
Write directly to the business owner as "you".
Be specific, use the actual numbers, and keep each insight to 1-2 sentences.
Format as a short paragraph followed by bullet points starting with "•".
Do not use headers or markdown formatting.
Never start with "Here are" or "Based on the data". Start with something natural and direct.

Business performance data for the week of ${weekStartStr} to ${weekEndStr}:
- Total bookings: ${total} (${bookingChangePct !== null ? `${bookingChangePct > 0 ? "+" : ""}${bookingChangePct}% vs last week` : "first week of data"})
- Completed: ${completed.length}, Canceled: ${canceled.length}
- Completion rate: ${completionRate}%
- Revenue: $${totalRevenue.toFixed(2)} (including $${totalTips.toFixed(2)} in tips)
- Average booking value: $${avgBookingValue.toFixed(2)}
- Top services: ${topServices.map((s) => `${s.name} (${s.count} bookings, $${s.revenue.toFixed(0)} revenue)`).join(", ") || "No completed services"}
- New clients: ${newClients}, Returning clients: ${returningClients}`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a concise, encouraging business advisor for beauty and wellness businesses." },
          { role: "user", content: prompt },
        ],
        max_tokens: 600,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a minute." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "Failed to generate insights" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const insightsText = aiData.choices?.[0]?.message?.content || "Unable to generate insights at this time.";

    // Save to database
    const { data: insight, error: insertError } = await adminClient
      .from("ai_insights")
      .insert({
        business_id: business.id,
        week_start: weekStartStr,
        week_end: weekEndStr,
        insights_text: insightsText,
        data_snapshot: dataSnapshot,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      // Might be duplicate, try fetching
      const { data: fallback } = await adminClient
        .from("ai_insights")
        .select("*")
        .eq("business_id", business.id)
        .eq("week_start", weekStartStr)
        .maybeSingle();
      return new Response(JSON.stringify(fallback || { insights_text: insightsText, data_snapshot: dataSnapshot }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(insight), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
