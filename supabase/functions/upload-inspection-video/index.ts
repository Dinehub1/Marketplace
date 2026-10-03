import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// SigV4 helper for Cloudflare R2
async function hmacSha256(key: Uint8Array | string, data: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyBytes = typeof key === "string" ? enc.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return new Uint8Array(signature);
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    let tripId = "";
    let driverId = "";
    let inspectionType: "before" | "after" = "before";
    let videoBytes: Uint8Array;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      tripId = (formData.get("trip_id") as string) || "";
      driverId = (formData.get("driver_id") as string) || "";
      inspectionType = ((formData.get("type") as string) === "after" ? "after" : "before");

      const file = formData.get("video") as File;
      if (!file) {
        // Fallback placeholder for web / simulator testing
        const placeholderText = `QuickDriver Inspection ${inspectionType} for ${tripId} at ${new Date().toISOString()}`;
        videoBytes = new TextEncoder().encode(placeholderText);
      } else {
        const buffer = await file.arrayBuffer();
        videoBytes = new Uint8Array(buffer);
      }
    } else {
      const json = await req.json().catch(() => ({}));
      tripId = json.trip_id || "";
      driverId = json.driver_id || "";
      inspectionType = json.type === "after" ? "after" : "before";

      if (json.video_base64) {
        const binaryStr = atob(json.video_base64);
        videoBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          videoBytes[i] = binaryStr.charCodeAt(i);
        }
      } else {
        const placeholderText = `QuickDriver ${inspectionType} video for ${tripId} at ${new Date().toISOString()}`;
        videoBytes = new TextEncoder().encode(placeholderText);
      }
    }

    if (!tripId) {
      return new Response(JSON.stringify({ error: "trip_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cloudflare R2 Credentials
    const account = Deno.env.get("CLOUDFLARE_R2_ACCOUNT_ID") || "85a63fd793363a3e2ec3eea325a9df8f";
    const bucket = Deno.env.get("CLOUDFLARE_R2_BUCKET_NAME") || "cashcard-data-storage";
    const accessKey = Deno.env.get("CLOUDFLARE_R2_ACCESS_KEY_ID") || "8abf62b2b59cc55242e30e1a7e5edef1";
    const secretKey = Deno.env.get("CLOUDFLARE_R2_SECRET_ACCESS_KEY") || "461d12b38e5f4b9ee9f30cad13c10bc7552e4d9b3437b7ff17d36fcd47f13b18";
    const publicUrl = (Deno.env.get("CLOUDFLARE_R2_PUBLIC_URL") || "https://pub-551b1770d52b457fa816410b239a2682.r2.dev").replace(/\/+$/, "");

    const key = `quickdriver/inspections/${tripId}/${inspectionType}_${Date.now()}.mp4`;
    const host = `${account}.r2.cloudflarestorage.com`;
    const canonicalUri = `/${bucket}/${key}`;

    const payloadHash = await sha256Hex(videoBytes);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);

    const headers: Record<string, string> = {
      host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      "content-type": "video/mp4",
    };

    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
    const canonicalHeaders = `content-type:video/mp4\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const scope = `${dateStamp}/auto/s3/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256Hex(new TextEncoder().encode(canonicalRequest))}`;

    const kDate = await hmacSha256(`AWS4${secretKey}`, dateStamp);
    const kRegion = await hmacSha256(kDate, "auto");
    const kService = await hmacSha256(kRegion, "s3");
    const kSigning = await hmacSha256(kService, "aws4_request");
    const signatureBytes = await hmacSha256(kSigning, stringToSign);
    const signature = Array.from(signatureBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const r2Url = `https://${host}${canonicalUri}`;
    const r2Resp = await fetch(r2Url, {
      method: "PUT",
      headers: { ...headers, authorization: authHeader },
      body: videoBytes,
    });

    if (!r2Resp.ok) {
      const errText = await r2Resp.text();
      console.error("R2 Upload error:", r2Resp.status, errText);
      return new Response(JSON.stringify({ error: "Failed to upload to Cloudflare R2", detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoPublicUrl = `${publicUrl}/${key}`;

    // Record in Supabase Database (qd_trip_videos & qd_trips)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Insert inspection video record
      await supabase.from("qd_trip_videos").insert({
        trip_id: tripId,
        driver_id: driverId || null,
        type: inspectionType,
        video_url: videoPublicUrl,
        duration_sec: 30,
      });

      // Update trip record
      const updateData =
        inspectionType === "before"
          ? { video_before_url: videoPublicUrl, updated_at: new Date().toISOString() }
          : { video_after_url: videoPublicUrl, updated_at: new Date().toISOString() };

      await supabase.from("qd_trips").update(updateData).eq("id", tripId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        trip_id: tripId,
        type: inspectionType,
        video_url: videoPublicUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Upload handler exception:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
