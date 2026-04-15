import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface EmailRequest {
  type: 'booking_confirmation' | 'booking_reminder' | 'booking_canceled';
  bookingId: string;
  recipientType: 'client' | 'business';
}

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set, skipping email");
    return { success: false, reason: "API key not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Polished <noreply@polishedbooking.com>",
      to: [to],
      reply_to: "support@polishedbooking.com",
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Email send error:", error);
    return { success: false, reason: error };
  }

  return { success: true };
};

const formatDate = (dateStr: string, lang: string = 'en') => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const generateConfirmationEmail = (data: {
  userName: string;
  businessName: string;
  serviceName: string;
  servicePrice: number;
  date: string;
  time: string;
  address: string;
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #000; }
        .accent { color: #FF69B4; }
        .card { background: #f9f9f9; border-radius: 12px; padding: 24px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .label { color: #666; }
        .value { font-weight: 500; }
        .cta { display: inline-block; background: linear-gradient(135deg, #FF69B4, #FF85C0); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 10px 0; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 40px; }
        .checkmark { font-size: 48px; color: #22c55e; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo"><span class="accent">Polished</span></div>
        </div>
        
        <div class="checkmark">✓</div>
        <h1 style="text-align: center; margin: 0;">Booking Confirmed!</h1>
        <p style="text-align: center; color: #666;">Hi ${data.userName}, your appointment has been confirmed.</p>
        
        <div class="card">
          <h3 style="margin-top: 0;">${data.businessName}</h3>
          <div class="detail-row">
            <span class="label">Service</span>
            <span class="value">${data.serviceName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Date</span>
            <span class="value">${data.date}</span>
          </div>
          <div class="detail-row">
            <span class="label">Time</span>
            <span class="value">${data.time}</span>
          </div>
          <div class="detail-row">
            <span class="label">Location</span>
            <span class="value">${data.address}</span>
          </div>
          <div class="detail-row">
            <span class="label">Price</span>
            <span class="value">$${data.servicePrice}</span>
          </div>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 14px;">
          Need to make changes? You can reschedule or cancel your appointment up to 24 hours before your scheduled time.
        </p>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Polished. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateReminderEmail = (data: {
  userName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  address: string;
  hoursUntil: number;
}) => {
  const timeText = data.hoursUntil === 24 ? 'tomorrow' : `in ${data.hoursUntil} hours`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #000; }
        .accent { color: #FF69B4; }
        .card { background: #f9f9f9; border-radius: 12px; padding: 24px; margin: 20px 0; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 40px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo"><span class="accent">Polished</span></div>
        </div>
        
        <h1 style="text-align: center;">Appointment Reminder</h1>
        <p style="text-align: center;">Hi ${data.userName}, your appointment is ${timeText}!</p>
        
        <div class="card">
          <p><strong>${data.businessName}</strong></p>
          <p>📅 ${data.date} at ${data.time}</p>
          <p>📍 ${data.address}</p>
          <p>💇 ${data.serviceName}</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Polished. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, bookingId, recipientType } = await req.json() as EmailRequest;

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // Fetch business details
    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", booking.business_id)
      .single();

    // Fetch service details
    const { data: service } = await supabase
      .from("services")
      .select("*")
      .eq("id", booking.service_id)
      .single();

    // Fetch client profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", booking.client_id)
      .single();

    if (!business || !service || !profile) {
      throw new Error("Missing required data");
    }

    const recipient = recipientType === 'client' ? profile.email : business.email;
    const lang = profile.preferred_language || 'en';

    let subject = '';
    let html = '';

    const emailData = {
      userName: profile.display_name || 'Valued Client',
      businessName: business.name,
      serviceName: service.name,
      servicePrice: booking.total_price,
      date: formatDate(booking.booking_date, lang),
      time: formatTime(booking.booking_time),
      address: `${business.address || ''}, ${business.city || ''}, ${business.state || ''}`,
    };

    switch (type) {
      case 'booking_confirmation':
        subject = lang === 'es' 
          ? `Cita confirmada con ${business.name}` 
          : `Appointment confirmed with ${business.name}`;
        html = generateConfirmationEmail(emailData);
        break;

      case 'booking_reminder':
        subject = lang === 'es'
          ? `Recordatorio: Tu cita es mañana`
          : `Reminder: Your appointment is tomorrow`;
        html = generateReminderEmail({ ...emailData, hoursUntil: 24 });
        break;

      case 'booking_canceled':
        subject = lang === 'es'
          ? `Cita cancelada con ${business.name}`
          : `Appointment canceled with ${business.name}`;
        html = `<p>Your appointment with ${business.name} has been canceled.</p>`;
        break;
    }

    if (recipient) {
      const result = await sendEmail(recipient, subject, html);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, reason: "No recipient" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
