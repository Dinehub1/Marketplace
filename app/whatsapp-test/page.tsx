"use client";

import { useState } from "react";

export default function WhatsAppTest() {
  const [apiKey, setApiKey] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [field, setField] = useState("to");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function run(auto: boolean) {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/wa-test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey, phone, code, recipientField: field, auto }),
      });
      setResult(await res.json());
    } catch (e: any) {
      setResult({ error: String(e?.message ?? e) });
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-bold">WhatsApp OTP — live test</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Sends a real <code>auth</code> template via Nextel (sender 916263461179). Use “Auto-detect
        field” first — it tries every likely recipient key and reports which one Nextel accepts.
      </p>

      <div className="mt-6 space-y-4 rounded-2xl border bg-white p-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Nextel API key (Bearer)</label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            placeholder="paste your real key (replaces YOUR_API_KEY)"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-500" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Your phone (10-digit)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-500" />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Code (optional)</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="auto"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-500" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Recipient field (single test)</label>
          <input value={field} onChange={(e) => setField(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-500" />
        </div>

        <div className="flex gap-3">
          <button onClick={() => run(true)} disabled={busy || !apiKey || !phone}
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
            {busy ? "Sending…" : "Auto-detect field & send"}
          </button>
          <button onClick={() => run(false)} disabled={busy || !apiKey || !phone}
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50">
            Send one
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6 rounded-2xl border bg-neutral-50 p-4">
          {result.working_recipient_field && (
            <p className="mb-2 rounded-lg bg-emerald-100 p-2 text-sm font-semibold text-emerald-800">
              ✓ Working recipient field: <code>{result.working_recipient_field}</code> — check WhatsApp for code {result.sent_code}
            </p>
          )}
          <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs text-neutral-700">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
