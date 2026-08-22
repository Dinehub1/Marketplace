import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WEB_BASE_URL, BRAND_SLUG } from "./config";

const KEY = "hermes-owner";

export type OwnerSession = { phone: string; token: string };

type OwnerContext = {
  session: OwnerSession | null;
  ready: boolean;
  /** Sends an OTP. Resolves on success; rejects with a message to show. */
  requestOtp: (phone: string) => Promise<void>;
  /** Verifies an OTP and, on success, establishes the session. */
  verifyOtp: (phone: string, code: string) => Promise<void>;
  signOut: () => void;
};

const Ctx = createContext<OwnerContext | null>(null);

/**
 * Owner authentication, reusing the web app's existing WhatsApp OTP endpoints
 * rather than introducing a second auth system. The app is a client of the same
 * backend; a parallel login path would be a second thing to keep secure.
 *
 * The token is kept in AsyncStorage, which is *not* encrypted at rest. That is
 * acceptable only because this token authorises reading your own leads and
 * editing your own listing — nothing financial. If the scope ever widens, this
 * must move to expo-secure-store before shipping.
 */
export function OwnerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setSession(JSON.parse(raw) as OwnerSession);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  async function post(path: string, body: unknown) {
    const res = await fetch(`${WEB_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Brand": BRAND_SLUG },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      // Surface the server's own wording where there is one: it knows why the
      // code was rejected and the user needs that, not "Request failed".
      throw new Error(
        (typeof data.error === "string" && data.error) ||
          "Couldn't reach the server. Check your connection and try again.",
      );
    }
    return data;
  }

  const value = useMemo<OwnerContext>(
    () => ({
      session,
      ready,
      requestOtp: async (phone) => {
        await post("/api/otp/send", { phone });
      },
      verifyOtp: async (phone, code) => {
        const data = await post("/api/otp/verify", { phone, code });
        const token = typeof data.token === "string" ? data.token : "";
        if (!token) throw new Error("The server did not return a session. Please try again.");
        // Keep the server's normalized 91XXXXXXXXXX form, not what was typed.
        // The token's signature is bound to that form, and the phone now
        // travels back on every request as x-phone — storing "98765 43210"
        // works only for as long as the server keeps normalizing it for us.
        const next = { phone: typeof data.phone === "string" && data.phone ? data.phone : phone, token };
        setSession(next);
        await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      },
      signOut: () => {
        setSession(null);
        AsyncStorage.removeItem(KEY).catch(() => {});
      },
    }),
    [session, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOwner(): OwnerContext {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOwner must be used inside <OwnerProvider>");
  return v;
}
