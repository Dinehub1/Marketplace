import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

/** Server-side Supabase client (uses anon/publishable key; RLS applies). */
export async function createClient() {
  const cookieStore = await cookies();
  const host = (await headers()).get("host") ?? "";
  // Share the session across all brand subdomains (one "Sarkar ID").
  const domain = host.includes("cashcard.live") ? ".cashcard.live" : undefined;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: { domain, path: "/", sameSite: "lax", secure: true },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component — safe to ignore
          }
        },
      },
    }
  );
}
