import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Edge functions get their secrets from the environment. This previously
    // read C:/Users/Administrator/hermes-web/.env, a path that cannot exist in
    // the Deno runtime, so every invocation threw before doing any work.
    //
    // This function drives dev_tasks / agents with the service role, so it must
    // NEVER be reachable without proving admin identity first. Auth is mandatory
    // and fail-closed — an unset ADMIN_TOKEN disables the function rather than
    // opening it up. Set ADMIN_TOKEN as a Supabase Function secret and send it
    // as `Authorization: Bearer <token>` or `x-admin-token: <token>`.
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!serviceKey) {
      return new Response(
        JSON.stringify({ error: "SUPABASE_SERVICE_ROLE_KEY is not set for this function" }),
        { status: 500 },
      );
    }

    const adminToken = Deno.env.get("ADMIN_TOKEN") ?? "";
    if (!adminToken) {
      return new Response(
        JSON.stringify({
          error: "ADMIN_TOKEN is not set for this function — refusing to run unauthenticated",
        }),
        { status: 500 },
      );
    }
    const auth = req.headers.get("authorization") ?? "";
    const headerToken = auth.startsWith("Bearer ") ? auth.slice(7) : (req.headers.get("x-admin-token") ?? "");
    if (!headerToken || headerToken !== adminToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceKey,
      { auth: { persistSession: false } }
    );

    const { action, slug, status, title, spec, assignee, priority, brand_id, task_id } = await req.json();

    if (action === "create_task") {
      const { data, error } = await supabase
        .from("dev_tasks")
        .insert({ 
          title, 
          spec: spec || null, 
          assignee: assignee || "dev-agent", 
          priority: priority || 100, 
          brand_id: brand_id || null, 
          status: "queued" 
        })
        .select()
        .single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ success: true, task: data }), { status: 200 });
    }

    if (action === "update_agent") {
      const { data, error } = await supabase
        .from("agents")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("slug", slug)
        .select()
        .single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ success: true, agent: data }), { status: 200 });
    }

    if (action === "run_agent") {
      const agentNames: Record<string, string> = {
        "dev-agent": "Manual run: Dev Agent",
        "data-enrichment": "Manual run: Data Enrichment",
        "idea-engine": "Manual run: Idea Engine",
        "memory": "Manual run: Memory Snapshot",
      };
      const { data, error } = await supabase
        .from("dev_tasks")
        .insert({
          title: agentNames[slug] || `Manual run: ${slug}`,
          spec: `Manually triggered run of ${slug}`,
          assignee: slug,
          priority: 1,
          status: "queued",
        })
        .select()
        .single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ success: true, task: data, message: "Task queued" }), { status: 200 });
    }

    if (action === "cancel_task") {
      const { data, error } = await supabase
        .from("dev_tasks")
        .update({ status: "cancelled", finished_at: new Date().toISOString() })
        .eq("id", task_id)
        .select()
        .single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ success: true, task: data }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "invalid action" }), { status: 400 });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
