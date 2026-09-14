"use client";

import { createBrowserClient } from "@supabase/ssr";
import { cookieDomainForHost } from "@/lib/base-domains";

// Scope the auth cookie to the apex so one login ("Sarkar ID") is shared across
// every brand subdomain, on whichever base domain the visitor is on
// (dropby.co.in during the migration, cashcard.live until it is retired).
// On localhost we leave it host-only.
function cookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return cookieDomainForHost(window.location.hostname);
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
