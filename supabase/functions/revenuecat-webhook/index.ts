import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-revenuecat-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RevenueCatEvent {
  id: string;
  type: string;
  app_id?: string;
  app_user_id: string;
  original_app_user_id?: string;
  aliases?: string[];
  product_id?: string;
  entitlement_id?: string | null;
  entitlement_ids?: string[] | null;
  purchased_at_ms?: number;
  expiration_at_ms?: number | null;
  grace_period_expiration_at_ms?: number | null;
  auto_resume_at_ms?: number | null;
  store?: string;
  environment?: "SANDBOX" | "PRODUCTION";
  period_type?: string;
  cancel_reason?: string;
  price?: number;
  price_in_purchased_currency?: number;
  currency?: string;
  purchased_currency?: string;
  transaction_id?: string;
  original_transaction_id?: string;
  subscriber_attributes?: Record<string, { value: string; updated_at_ms: number }>;
  transferred_from?: string[];
  transferred_to?: string[];
}

interface RevenueCatWebhookPayload {
  api_version?: string;
  event: RevenueCatEvent;
}

function resolveStatus(event: RevenueCatEvent): string {
  switch (event.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
    case "NON_RENEWING_PURCHASE":
      return "active";

    case "CANCELLATION":
      // If refunded via customer support/store, immediate loss of access
      if (event.cancel_reason === "CUSTOMER_SUPPORT") {
        return "refunded";
      }
      // Standard cancellation (auto-renew turned off): user still has access until expires_at
      return "cancelled";

    case "EXPIRATION":
      return "expired";

    case "SUBSCRIPTION_PAUSED":
      return "paused";

    case "BILLING_ISSUE":
      return "in_grace_period";

    case "TRANSFER":
      return "active";

    default:
      return "active";
  }
}

function toIsoDate(ms?: number | null): string | null {
  if (typeof ms === "number" && ms > 0) {
    return new Date(ms).toISOString();
  }
  return null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Verify Secret Authorization
    const authHeader = req.headers.get("authorization") ?? req.headers.get("x-revenuecat-secret") ?? "";
    const expectedAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH") ?? Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "";

    if (expectedAuth) {
      const cleanReceived = authHeader.replace(/^Bearer\s+/i, "").trim();
      const cleanExpected = expectedAuth.replace(/^Bearer\s+/i, "").trim();
      if (cleanReceived !== cleanExpected) {
        console.warn("[revenuecat-webhook] Unauthorized request attempt");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.info("[revenuecat-webhook] REVENUECAT_WEBHOOK_AUTH not set, proceeding without auth check");
    }

    // 2. Initialize Supabase Service Role Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceKey) {
      console.error("[revenuecat-webhook] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 3. Parse Webhook Body
    const body: RevenueCatWebhookPayload = await req.json();
    const event = body?.event;

    if (!event || !event.id || !event.type) {
      return new Response(JSON.stringify({ error: "Invalid webhook payload: event missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(
      `[revenuecat-webhook] Processing event ${event.id} type=${event.type} user=${event.app_user_id} product=${event.product_id}`
    );

    // 4. Handle TEST Events (Dashboard ping)
    if (event.type === "TEST") {
      await supabase.from("revenuecat_webhook_events").upsert(
        {
          event_id: event.id,
          event_type: "TEST",
          app_user_id: event.app_user_id || "test_user",
          original_app_user_id: event.original_app_user_id || null,
          product_id: event.product_id || null,
          entitlement_ids: [],
          store: event.store || "TEST_STORE",
          environment: event.environment || "SANDBOX",
          payload: body,
        },
        { onConflict: "event_id" }
      );

      return new Response(
        JSON.stringify({ success: true, message: "Test webhook received and verified successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Idempotency Check (Deduplication)
    const { data: existingEvent } = await supabase
      .from("revenuecat_webhook_events")
      .select("id")
      .eq("event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      console.log(`[revenuecat-webhook] Event ${event.id} already processed. Skipping duplicate.`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Event already processed (idempotent)",
          event_id: event.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Normalize Entitlements
    let entitlementIds: string[] = [];
    if (Array.isArray(event.entitlement_ids) && event.entitlement_ids.length > 0) {
      entitlementIds = event.entitlement_ids.filter(Boolean);
    } else if (event.entitlement_id) {
      entitlementIds = [event.entitlement_id];
    }

    // Default entitlement fallback if product belongs to pdf tools
    if (entitlementIds.length === 0 && event.product_id?.startsWith("pdf_")) {
      entitlementIds = ["pdf_pro"];
    }

    // 7. Record to Audit Log (revenuecat_webhook_events)
    const { error: eventInsertError } = await supabase.from("revenuecat_webhook_events").insert({
      event_id: event.id,
      event_type: event.type,
      app_user_id: event.app_user_id,
      original_app_user_id: event.original_app_user_id || null,
      product_id: event.product_id || null,
      entitlement_ids: entitlementIds,
      store: event.store || null,
      environment: event.environment || "PRODUCTION",
      payload: body,
    });

    if (eventInsertError) {
      console.error("[revenuecat-webhook] Failed to log webhook event:", eventInsertError);
    }

    // 8. Upsert Current State into user_subscriptions
    const status = resolveStatus(event);
    const isSandbox = event.environment === "SANDBOX";
    const purchasedAt = toIsoDate(event.purchased_at_ms);
    const expiresAt = toIsoDate(event.expiration_at_ms);
    const gracePeriodExpiresAt = toIsoDate(event.grace_period_expiration_at_ms);
    const autoResumeAt = toIsoDate(event.auto_resume_at_ms);

    if (event.app_user_id && event.product_id) {
      const subscriptionRecord = {
        app_user_id: event.app_user_id,
        original_app_user_id: event.original_app_user_id || null,
        aliases: Array.isArray(event.aliases) ? event.aliases : [],
        product_id: event.product_id,
        entitlement_ids: entitlementIds,
        status,
        store: event.store || null,
        environment: event.environment || (isSandbox ? "SANDBOX" : "PRODUCTION"),
        is_sandbox: isSandbox,
        period_type: event.period_type || null,
        purchased_at: purchasedAt,
        expires_at: expiresAt,
        grace_period_expires_at: gracePeriodExpiresAt,
        auto_resume_at: autoResumeAt,
        cancel_reason: event.cancel_reason || null,
        original_transaction_id: event.original_transaction_id || null,
        latest_transaction_id: event.transaction_id || null,
        price_in_purchased_currency: event.price_in_purchased_currency ?? event.price ?? null,
        currency: event.currency || event.purchased_currency || null,
        latest_event_id: event.id,
        latest_event_type: event.type,
        metadata: {
          subscriber_attributes: event.subscriber_attributes || {},
          app_id: event.app_id || null,
        },
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("user_subscriptions")
        .upsert(subscriptionRecord, { onConflict: "app_user_id,product_id" });

      if (upsertError) {
        console.error("[revenuecat-webhook] Error updating user_subscriptions:", upsertError);
        return new Response(JSON.stringify({ error: upsertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(
        `[revenuecat-webhook] Successfully updated user_subscriptions for user=${event.app_user_id} product=${event.product_id} status=${status}`
      );
    }

    // 9. Handle TRANSFER Events
    if (event.type === "TRANSFER" && Array.isArray(event.transferred_from) && event.product_id) {
      for (const oldUserId of event.transferred_from) {
        if (oldUserId !== event.app_user_id) {
          await supabase
            .from("user_subscriptions")
            .update({
              status: "expired",
              cancel_reason: "TRANSFERRED",
              updated_at: new Date().toISOString(),
            })
            .eq("app_user_id", oldUserId)
            .eq("product_id", event.product_id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        event_id: event.id,
        status,
        app_user_id: event.app_user_id,
        product_id: event.product_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[revenuecat-webhook] Unexpected error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
