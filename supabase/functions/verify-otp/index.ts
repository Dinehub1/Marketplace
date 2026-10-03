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
    let body: { phone?: string; otp?: string } = {};
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { phone: rawPhone, otp } = body;
    if (!rawPhone || !otp) {
      return new Response(JSON.stringify({ error: "Phone and OTP are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const digits = rawPhone.replace(/\D/g, "");
    const phone10 = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.slice(-10);
    const dbPhone = `+91${phone10}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase server configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Verify OTP in auth_otps table
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from("auth_otps")
      .select("*")
      .eq("phone", dbPhone)
      .eq("otp_code", otp.trim())
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return new Response(JSON.stringify({ error: "Invalid or expired OTP" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark OTP as verified
    await supabaseAdmin
      .from("auth_otps")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // 2. Ensure user exists in Supabase Auth
    // Use a secure internal deterministic password derived from service key + phone
    const internalSecret = supabaseServiceKey.slice(0, 16);
    const userPassword = `HpAuth_${internalSecret}_${phone10}!`;

    let userId: string | null = null;
    let authUser: any = null;

    // Check if user already exists
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existing = userList?.users?.find(
      (u) => u.phone === dbPhone || u.email === `${phone10}@highwaypass.dropby.co.in`
    );

    if (existing) {
      userId = existing.id;
      authUser = existing;
      // Ensure password is synchronized so signInWithPassword generates standard tokens
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: userPassword,
        phone_confirm: true,
      });
    } else {
      // Create new authenticated user
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone: dbPhone,
        email: `${phone10}@highwaypass.dropby.co.in`,
        password: userPassword,
        phone_confirm: true,
        user_metadata: { phone: dbPhone, app: "highwaypass" },
      });

      if (createError || !created.user) {
        console.error("Failed to create auth user:", createError);
        return new Response(JSON.stringify({ error: "Failed to create user account", detail: createError?.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = created.user.id;
      authUser = created.user;
    }

    // 3. Authenticate and obtain real Supabase session tokens
    const clientAnonKey = supabaseAnonKey || supabaseServiceKey;
    const supabaseClient = createClient(supabaseUrl, clientAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      phone: dbPhone,
      password: userPassword,
    });

    if (signInError || !signInData.session) {
      // Fallback with email identifier if phone login is disabled in project settings
      const { data: emailSignIn, error: emailError } = await supabaseClient.auth.signInWithPassword({
        email: `${phone10}@highwaypass.dropby.co.in`,
        password: userPassword,
      });

      if (emailError || !emailSignIn.session) {
        console.error("Sign-in session generation failed:", signInError || emailError);
        return new Response(JSON.stringify({ error: "Session creation failed", detail: (signInError || emailError)?.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          session: emailSignIn.session,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: signInData.session,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unhandled verify-otp error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
