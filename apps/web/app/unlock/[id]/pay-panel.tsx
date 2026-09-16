"use client";

/**
 * The paywall panel: verify the phone, pay, get the clean file.
 *
 * Styled with the platform's own design system (the component classes in
 * globals.css and the token utilities), not with local colours, so this page
 * looks like the rest of the site and inherits dark mode for free. Money is the
 * one place where a page that looks "bolted on" costs trust.
 *
 * What it deliberately does not trust:
 *  - the price comes from the server (the same `products` row the order uses);
 *  - the clean URL is never rendered until GET /api/job/<id> says a paid order
 *    exists for this job and this phone;
 *  - the token lives in localStorage (same key the rest of the site uses) and
 *    travels in headers, never in the URL.
 */
import { useCallback, useEffect, useState } from "react";

type Props = { jobId: number; pricePaise: number; previewUrl: string | null };

/** Razorpay Checkout, injected once on demand so the panel works with JS alone. */
function loadCheckout(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.Razorpay) return resolve(w.Razorpay);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error("Checkout failed to load")));
    s.onerror = () => reject(new Error("Checkout failed to load"));
    document.head.appendChild(s);
  });
}

export default function PayPanel({ jobId, pricePaise, previewUrl }: Props) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleanUrl, setCleanUrl] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const rupees = Math.round(pricePaise / 100);
  const isPdf = Boolean(previewUrl && previewUrl.toLowerCase().endsWith(".pdf"));

  // A stored token from elsewhere on the site is reused rather than asking again.
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("hermes_otp_token") : null;
    const storedPhone = typeof window !== "undefined" ? localStorage.getItem("hermes_phone") : null;
    if (stored && storedPhone) {
      setToken(stored);
      setPhone(storedPhone);
    }
  }, []);

  const refresh = useCallback(
    async (tok: string, ph: string) => {
      const res = await fetch(`/api/job/${jobId}`, {
        headers: { "x-phone": ph, "x-phone-token": tok },
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.output_url) setCleanUrl(j.output_url);
      return j;
    },
    [jobId],
  );

  useEffect(() => {
    if (token && phone) void refresh(token, phone);
  }, [token, phone, refresh]);

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Could not send the code");
      if (j.delivered === false) {
        setNote("WhatsApp delivery is not working right now — check the server log for the code.");
      }
      setStage("code");
    } catch (e: any) {
      setError(e?.message || "Could not send the code");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Could not verify the code");
      localStorage.setItem("hermes_otp_token", j.token);
      localStorage.setItem("hermes_phone", j.phone);
      setToken(j.token);
      // The order route also claims the job for this phone.
      await pay(j.token, j.phone);
    } catch (e: any) {
      setError(e?.message || "Could not verify the code");
    } finally {
      setBusy(false);
    }
  }

  async function pay(tok: string, ph: string) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ job_id: jobId, phone: ph, token: tok }),
    });
    const j = await res.json();
    if (res.status === 503 || j?.configured === false) {
      setError("Payments are not switched on yet. Your file is safe — try again later.");
      return;
    }
    if (res.status === 401) {
      setError("That number is not verified. Send a new code.");
      setStage("phone");
      localStorage.removeItem("hermes_otp_token");
      setToken(null);
      return;
    }
    if (!res.ok) throw new Error(j?.error || "Could not start the payment");
    if (j.already) {
      await refresh(tok, ph);
      return;
    }

    const Razorpay = await loadCheckout();
    const rzp = new Razorpay({
      key: j.key_id,
      amount: j.amount_paise,
      currency: j.currency,
      order_id: j.order_id,
      name: "DropBy",
      description: `Clean file for job ${jobId}`,
      prefill: { contact: ph.replace(/^91/, "") },
      theme: { color: "#1d4ed8" },
      handler: async (resp: any) => {
        const vr = await fetch("/api/orders/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ job_id: jobId, phone: ph, token: tok, ...resp }),
        });
        const vj = await vr.json().catch(() => ({}));
        if (vr.ok && (vj.output_url || vj.paid)) {
          if (vj.output_url) setCleanUrl(vj.output_url);
          else await refresh(tok, ph);
        } else {
          setError(vj?.error || "Payment could not be confirmed. If money left your account, it will be reconciled.");
        }
      },
      modal: {
        ondismiss: () => setError("Payment cancelled. Nothing was charged."),
      },
    });
    rzp.open();
  }

  return (
    <div className="flex flex-col gap-4">
      {previewUrl ? (
        <div className="card p-4">
          {isPdf ? (
            /* A PDF cannot render in an <img>. Hand it over as a link the customer
               can read in their own viewer — which is also how they will print it. */
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-block mb-3"
              data-testid="preview-pdf"
            >
              Open the watermarked preview PDF
            </a>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt="Watermarked preview of your file"
              className="w-full rounded-[var(--r-sm)] bg-[var(--surface-sunken)] block mb-3"
            />
          )}
          <p className="text-[0.8125rem] text-ink-3 m-0">
            This preview is watermarked. The paid file is not.
          </p>
        </div>
      ) : null}

      {cleanUrl ? (
        <div className="card p-4" style={{ borderColor: "var(--positive)" }}>
          <p className="heading-sm m-0 mb-3">Paid — your clean file is ready</p>
          <a href={cleanUrl} download className="btn btn-primary btn-block" data-testid="clean-download">
            Download the file
          </a>
          <p className="mono text-[0.8125rem] text-ink-3 m-0 mt-3 break-all">
            Keep this link: {cleanUrl.split("/").pop()}
          </p>
        </div>
      ) : (
        <div className="card p-4">
          <p className="label">Verify your WhatsApp number</p>
          <p className="mono m-0 mb-3 text-[1.0625rem] font-semibold" style={{ color: "var(--info)" }}>
            {"\u20b9"}
            {rupees} · one clean file, this job
          </p>
          {stage === "phone" ? (
            <>
              <input
                className="input mb-3"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
              <button
                className="btn btn-primary btn-block"
                onClick={sendCode}
                disabled={busy || phone.length < 10}
              >
                {busy ? "Sending…" : "Send me a code on WhatsApp"}
              </button>
            </>
          ) : (
            <>
              <input
                className="input mb-3"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <button
                className="btn btn-primary btn-block"
                onClick={verifyCode}
                disabled={busy || code.length < 6}
              >
                {busy ? "Checking…" : `Verify and pay \u20b9${rupees}`}
              </button>
              <button className="btn btn-ghost btn-block mt-2" onClick={() => setStage("phone")}>
                Use a different number
              </button>
            </>
          )}
          <p className="text-[0.8125rem] text-ink-3 m-0 mt-3">
            We ask for the number so the payment can be traced to you — and so this file can be
            reopened on any device.
          </p>
        </div>
      )}

      {note ? <p className="text-[0.8125rem] text-ink-3 m-0">{note}</p> : null}
      {error ? (
        <p className="text-[0.875rem] m-0" style={{ color: "var(--critical)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
