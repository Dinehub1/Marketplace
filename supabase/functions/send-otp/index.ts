import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let body: { phone?: string } = {};
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { phone: rawPhone } = body;
    if (!rawPhone) {
      return new Response(JSON.stringify({ error: "Phone number is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize phone number (strip spaces, +, hyphens)
    const digits = rawPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid phone number length" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phone10 = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.slice(-10);
    const phoneWith91 = `91${phone10}`;
    const dbPhone = `+${phoneWith91}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase server configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store in auth_otps table
    const { error: dbError } = await supabase
      .from("auth_otps")
      .upsert(
        {
          phone: dbPhone,
          otp_code: otp,
          verified: false,
          created_at: new Date().toISOString(),
          expires_at: expiresAt,
        },
        { onConflict: "phone" }
      );

    if (dbError) {
      console.error("Failed to store OTP in database:", dbError);
      return new Response(JSON.stringify({ error: "Database error storing OTP", detail: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via Nextel WhatsApp API if configured
    const nextelEndpoint = Deno.env.get("NEXTEL_ENDPOINT") || "https://api.nextel.io/API_V2/Whatsapp/send_template";
    const nextelApiKey = Deno.env.get("NEXTEL_API_KEY");
    const nextelSender = (Deno.env.get("NEXTEL_SENDER") || "6263461179").replace(/\D/g, "").slice(-10);

    let sentViaWhatsApp = false;
    let whatsappWarning = undefined;

    if (nextelApiKey) {
      try {
        const url = nextelEndpoint.endsWith(nextelApiKey)
          ? nextelEndpoint
          : `${nextelEndpoint.replace(/\/+$/, "")}/${nextelApiKey}`;

        const payload = {
          type: "buttonTemplate",
          templateId: Deno.env.get("NEXTEL_AUTH_TEMPLATE") || "auth",
          templateLanguage: "en",
          sender_phone: nextelSender,
          templateArgs: [otp],
          to: phoneWith91,
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          sentViaWhatsApp = true;
        } else {
          const errText = await res.text();
          console.warn("Nextel WhatsApp send failed:", res.status, errText);
          whatsappWarning = `WhatsApp delivery note: ${errText.slice(0, 100)}`;
        }
      } catch (err: any) {
        console.warn("Nextel WhatsApp network error:", err.message);
        whatsappWarning = err.message;
      }
    } else {
      whatsappWarning = "NEXTEL_API_KEY not configured. Use dev_otp to verify.";
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP generated",
        dev_otp: otp, // Returned for dev testing & fallback
        sent_whatsapp: sentViaWhatsApp,
        warning: whatsappWarning,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unhandled send-otp error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
