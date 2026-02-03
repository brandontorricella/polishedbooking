import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(options: { from: string; to: string[]; replyTo?: string; subject: string; html: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(options),
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Resend API error: ${error}`);
  }
  
  return res.json();
}

interface SupportRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: SupportRequest = await req.json();

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supportEmail = Deno.env.get("SUPPORT_EMAIL");
    if (!supportEmail) {
      console.error("SUPPORT_EMAIL not configured");
      return new Response(
        JSON.stringify({ error: "Support email not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email to support team
    const supportEmailResult = await sendEmail({
      from: "Polished Support <noreply@resend.dev>",
      to: [supportEmail],
      replyTo: email,
      subject: `[Polished Support] ${subject || "New Message"} from ${name}`,
      html: `
        <h2>New Support Inquiry</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject || "General Inquiry"}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-top: 8px;">
          ${message.replace(/\n/g, "<br>")}
        </div>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 12px;">
          Sent at: ${new Date().toISOString()}<br>
          Reply directly to this email to respond to the customer.
        </p>
      `,
    });

    console.log("Support email sent:", supportEmailResult);

    // Send confirmation to customer
    const confirmationResult = await sendEmail({
      from: "Polished <noreply@resend.dev>",
      to: [email],
      subject: "We received your message - Polished Support",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #000;">Thanks for reaching out, ${name}!</h1>
          <p>We've received your message and will get back to you within 24 hours.</p>
          
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; color: #666;"><strong>Your message:</strong></p>
            <p style="margin: 8px 0 0;">${message.replace(/\n/g, "<br>")}</p>
          </div>
          
          <p>In the meantime, you might find answers in our <a href="https://polished.app/help" style="color: #FF69B4;">Help Center</a>.</p>
          
          <p style="color: #666; margin-top: 32px; font-size: 14px;">
            Best regards,<br>
            The Polished Team
          </p>
        </div>
      `,
    });

    console.log("Confirmation email sent:", confirmationResult);

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
