"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOut() {
  const router = useRouter();
  async function onClick() {
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-hairline px-3 py-1.5 text-sm text-ink-2 transition hover:bg-surface-sunken"
    >
      Sign out
    </button>
  );
}
