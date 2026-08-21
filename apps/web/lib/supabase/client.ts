"use client";

import { createBrowserClient } from "@supabase/ssr";

// Scope the auth cookie to the apex so one login ("Sarkar ID") is shared across
// every brand subdomain (*.cashcard.live). On localhost we leave it host-only.
function cookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.hostname.endsWith("cashcard.live") ? ".cashcard.live" : undefined;
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookieOptions: {
        domain: cookieDomain(),
        path: "/",
        sameSite: "lax",
        secure: typeof window !== "undefined" && window.location.protocol === "https:",
      },
    }
  );
}
