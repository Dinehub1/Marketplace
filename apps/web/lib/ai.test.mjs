/**
 * The router's contract, tested without keys and without the network.
 *
 * Run: `node --test apps/web/lib/ai.test.mjs` (or `npm run test:ai -w @hermes/web`).
 *
 * What this pins, and why each one is a real failure mode rather than a style rule:
 *  - a chain cannot lose its ₹0 last resort without the test failing (`KEY_ONLY` is the
 *    documented exception list);
 *  - a provider that throws, times out or fails its health check must not stop the chain —
 *    the whole point of docs/resources-and-apis.md §3;
 *  - a chain that runs out must say so: `ok: false` with every reason, never an empty answer;
 *  - the record that goes into a job's `meta` must name the provider that actually answered.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CHAINS, KEY_ONLY, PROVIDERS, ProviderError, runChain, metaFor, providerTable,
  rulesAnswer, trigramScore, trigrams,
} from "./ai.ts";

const KEY_NAMES = [
  "CLOUDFLARE_AI_TOKEN", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_R2_ACCOUNT_ID",
  "GEMINI_API_KEY", "GROQ_API_KEY",
];

/** Run a body with every AI key removed from the environment — the state of this box today. */
async function withNoKeys(body) {
  const saved = Object.fromEntries(KEY_NAMES.map((n) => [n, process.env[n]]));
  for (const n of KEY_NAMES) delete process.env[n];
  try {
    return await body();
  } finally {
    for (const [n, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[n];
      else process.env[n] = v;
    }
  }
}

function fake(id, overrides = {}) {
  return {
    id,
    kind: "local",
    cost: "₹0 test provider",
    capabilities: ["text"],
    available: () => ({ ok: true }),
    async run() {
      return { text: `${id} answered`, meta: { provider: id } };
    },
    ...overrides,
  };
}

test("every chain id exists, and every chain ends on its ₹0 local slot", () => {
  for (const [capability, chain] of Object.entries(CHAINS)) {
    assert.ok(chain.length > 0, `${capability} has an empty chain`);
    assert.equal(new Set(chain).size, chain.length, `${capability} lists a provider twice`);
    for (const id of chain) {
      assert.ok(PROVIDERS.some((p) => p.id === id), `${capability} names "${id}", which is not a registered provider`);
    }
    const last = PROVIDERS.find((p) => p.id === chain[chain.length - 1]);
    if (!KEY_ONLY.includes(capability)) {
      // The point: a capability we claim works with no key must end on an engine that runs
      // here. The KEY_ONLY ones are free to end on a remote model (translate has no local
      // engine at all) or on a local slot that cannot run yet (tesseract, piper).
      assert.equal(last.kind, "local", `${capability} is not KEY_ONLY but ends on the remote ${last.id}`);
    }
  }
});

/**
 * The claim in docs/resources-and-apis.md §3 is that every capability still answers with no
 * key at all, and that the ones that cannot are *named*. This is that claim, checked: with
 * every key removed, a capability must have a provider that reports itself available — unless
 * it is on KEY_ONLY, in which case the reasons must be the documented ones.
 */
test("with zero keys only KEY_ONLY capabilities are unservable", async () => {
  await withNoKeys(async () => {
    // The search chain's ₹0 engine is the app's own database, so the app always has these two
    // values; they are not AI keys, and their absence is not what this test is about.
    const saved = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
    process.env.SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    try {
      const unservable = [];
      for (const capability of Object.keys(CHAINS)) {
        const chain = CHAINS[capability].map((id) => PROVIDERS.find((p) => p.id === id));
        if (!chain.some((p) => p.available(capability).ok)) unservable.push(capability);
      }
      assert.deepEqual(
        unservable.sort(),
        [...KEY_ONLY].sort(),
        "the list of capabilities that need a key changed — KEY_ONLY must be updated with the reason",
      );
      for (const capability of Object.keys(CHAINS)) {
        if (KEY_ONLY.includes(capability)) continue;
        const reasons = CHAINS[capability]
          .map((id) => PROVIDERS.find((p) => p.id === id))
          .map((p) => p.available(capability))
          .filter((a) => !a.ok);
        for (const a of reasons) assert.ok(a.reason.length > 20, "a skipped provider must explain itself in a sentence");
      }
    } finally {
      if (saved.url === undefined) delete process.env.SUPABASE_URL;
      else process.env.SUPABASE_URL = saved.url;
      if (saved.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = saved.key;
    }
  });
});

test("providerTable reports one row per chain entry with the reason it cannot run", () => {
  const rows = providerTable();
  const total = Object.values(CHAINS).reduce((n, chain) => n + chain.length, 0);
  assert.equal(rows.length, total);
  const vision = rows.filter((r) => r.capability === "vision");
  assert.equal(vision[vision.length - 1].provider, "tesseract");
  assert.equal(vision[vision.length - 1].available, false);
  assert.match(vision[vision.length - 1].reason, /tesseract is not installed/);
});

test("rules: a listing description quotes only the facts it was given", () => {
  const text = rulesAnswer({
    kind: "listing-description",
    facts: { name: "Sharma Electricals", category: "electrician", area: "Vijay Nagar", phone: "9876543210", rating: 4.5 },
  });
  assert.equal(text, "Sharma Electricals is a electrician in Vijay Nagar. Phone: 9876543210. Rated 4.5 out of 5 in the directory.");

  const bare = rulesAnswer({ kind: "listing-description", facts: { name: "Sharma Electricals" } });
  assert.equal(bare, "Sharma Electricals is a business in Indore.");
  assert.doesNotMatch(bare, /Phone|Rated/, "facts that were not supplied must not appear");

  assert.throws(() => rulesAnswer({ kind: "listing-description", facts: {} }), ProviderError);
  assert.throws(() => rulesAnswer({ kind: "write-me-a-poem", text: "x" }), /no template called "write-me-a-poem"/);
});

test("rules: tidy collapses whitespace and cuts at a sentence, not mid-word", () => {
  const flat = rulesAnswer({ kind: "tidy", text: "  one   two\n\nthree  " });
  assert.equal(flat, "one two three");
  const text = "First sentence here. Second sentence follows. Third one is dropped.";
  // 45 chars lands exactly on the second full stop, so the second sentence survives.
  assert.equal(rulesAnswer({ kind: "tidy", text, limit: 45 }), "First sentence here. Second sentence follows.");
  // 40 chars would cut inside the second sentence, so the router backs up to the first one.
  assert.equal(rulesAnswer({ kind: "tidy", text, limit: 40 }), "First sentence here.");
  const noStop = rulesAnswer({ kind: "tidy", text: "x".repeat(100), limit: 10 });
  assert.equal(noStop, "xxxxxxxxxx…");
});

test("trigram scoring ranks a matching name above an unrelated one", () => {
  assert.equal(trigramScore("plumber", "plumber"), 1);
  assert.equal(trigramScore("plumber", "zzz"), 0);
  assert.ok(trigramScore("plumber", "plumbing") > 0.3);
  const query = "plumber vijay nagar";
  const hit = trigramScore(query, "Sharma Plumber Vijay Nagar electrician Vijay Nagar");
  const miss = trigramScore(query, "bottom fire plumber indore");
  assert.ok(hit > miss, `${hit} should beat ${miss}`);
  assert.ok(trigrams("ab").size >= 1);
});

test("with zero keys the text chain falls through to the template and the record names it", async () => {
  await withNoKeys(async () => {
    const outcome = await runChain("text", {
      kind: "listing-description",
      facts: { name: "Advi Plumbing Pvt. Ltd.", category: "plumber", area: "Airport Road" },
    });
    assert.equal(outcome.ok, true);
    assert.equal(outcome.record.provider, "rules");
    assert.equal(outcome.answer.text, "Advi Plumbing Pvt. Ltd. is a plumber in Airport Road.");
    assert.deepEqual(
      outcome.record.attempts.map((a) => `${a.provider}:${a.outcome}`),
      ["workers-ai-text:skipped", "gemini:skipped", "groq:skipped", "rules:ok"],
    );
    for (const attempt of outcome.record.attempts.slice(0, 3)) {
      assert.match(attempt.detail, /is not set|token/i, `${attempt.provider} must say why it was skipped`);
    }
    const meta = metaFor(outcome.record);
    assert.equal(meta.ai_provider, "rules");
    assert.equal(meta.ai_ok, true);
    assert.equal(meta.ai_capability, "text");
    assert.deepEqual(meta.ai_tries, ["workers-ai-text:skipped", "gemini:skipped", "groq:skipped", "rules:ok"]);
  });
});

test("a provider that throws does not stop the chain", async () => {
  const outcome = await runChain("text", { prompt: "hello" }, {
    providers: [
      fake("first-remote", { kind: "remote", async run() { throw new ProviderError("upstream exploded", 500); } }),
      fake("second"),
    ],
    chains: { text: ["first-remote", "second"] },
    checkHealth: false,
  });
  assert.equal(outcome.ok, true);
  assert.equal(outcome.record.provider, "second");
  assert.equal(outcome.record.attempts[0].outcome, "error");
  assert.match(outcome.record.attempts[0].detail, /upstream exploded/);
  assert.equal(outcome.record.attempts[0].tries, 2, "a remote 5xx is retried once");
  assert.match(outcome.record.attempts[0].detail, /the first try was retried once/);
  assert.equal(outcome.record.attempts[1].outcome, "ok");
  assert.equal(outcome.answer.text, "second answered");
});

test("a 4xx is not retried, and the second 5xx is the answer", async () => {
  let calls = 0;
  const always500 = fake("always-500", {
    kind: "remote",
    async run() { calls += 1; throw new ProviderError("still down", 500); },
  });
  const outcome = await runChain("text", { prompt: "x" }, {
    providers: [always500, fake("last")],
    chains: { text: ["always-500", "last"] },
    checkHealth: false,
  });
  assert.equal(calls, 2, "two tries, no more");
  assert.equal(outcome.record.attempts[0].tries, 2);
  assert.equal(outcome.record.provider, "last");

  let badCalls = 0;
  const rejects400 = fake("bad-request", {
    kind: "remote",
    async run() { badCalls += 1; throw new ProviderError("prompt is too long", 400); },
  });
  await runChain("text", { prompt: "x" }, { providers: [rejects400], chains: { text: ["bad-request"] }, checkHealth: false });
  assert.equal(badCalls, 1, "a caller mistake must not be retried");
});

test("a provider that never answers is abandoned at its timeout and recorded as a timeout", async () => {
  const outcome = await runChain("text", { prompt: "hello" }, {
    providers: [
      fake("hangs", { kind: "remote", async run(_input, ctx) {
        await new Promise((resolve, reject) => {
          ctx.signal.addEventListener("abort", () => reject(new Error("aborted")));
        });
      } }),
      fake("patient"),
    ],
    chains: { text: ["hangs", "patient"] },
    timeoutMs: 150,
    checkHealth: false,
  });
  assert.equal(outcome.ok, true);
  assert.equal(outcome.record.provider, "patient");
  assert.equal(outcome.record.attempts[0].outcome, "timeout");
  assert.match(outcome.record.attempts[0].detail, /no answer in 150 ms/);
});

test("a provider that fails its health check is skipped without being run", async () => {
  let ran = 0;
  const outcome = await runChain("text", { prompt: "hello" }, {
    providers: [
      fake("sick", {
        async health() { return { ok: false, detail: "GET /models answered 401" }; },
        async run() { ran += 1; return { text: "should not happen", meta: {} }; },
      }),
      fake("healthy"),
    ],
    chains: { text: ["sick", "healthy"] },
  });
  assert.equal(ran, 0);
  assert.equal(outcome.record.attempts[0].outcome, "unhealthy");
  assert.match(outcome.record.attempts[0].detail, /401/);
  assert.equal(outcome.record.provider, "healthy");
});

test("a chain that runs out fails with every reason, never with an empty answer", async () => {
  await withNoKeys(async () => {
    const outcome = await runChain("vision", { prompt: "read this", bytes: new Uint8Array([1, 2, 3]) });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.answer, null);
    assert.equal(outcome.record.provider, null);
    assert.match(outcome.record.detail, /no provider in the vision chain could serve this/);
    assert.match(outcome.record.detail, /workers-ai-vision \(skipped/);
    assert.match(outcome.record.detail, /tesseract \(skipped: tesseract is not installed/);
    assert.equal(outcome.record.attempts.length, 3);

    const meta = metaFor(outcome.record);
    assert.equal(meta.ai_provider, "none");
    assert.equal(meta.ai_ok, false);
    assert.match(meta.ai_detail, /tesseract is not installed/);

    const search = await runChain("search", {});
    assert.equal(search.ok, false);
    assert.match(search.record.detail, /supabase-like \(skipped/);
  });
});

test("the search chain runs a real query shape, and refuses an empty one", async () => {
  const saved = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
  process.env.SUPABASE_URL = "http://127.0.0.1:9/";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
  try {
    // No query: the provider is available, so the chain must report the provider's own reason.
    const empty = await runChain("search", {}, { checkHealth: false });
    assert.equal(empty.ok, false);
    assert.match(empty.record.attempts[0].detail, /search needs \?text=/);

    // A real query: the URL the provider builds is what answers — a dead port must surface as
    // an error naming the provider, not as silence.
    const dead = await runChain("search", { text: "plumber" }, { checkHealth: false });
    assert.equal(dead.ok, false);
    assert.equal(dead.record.attempts[0].provider, "supabase-like");
    assert.equal(dead.record.attempts[0].outcome, "error");
    assert.ok(dead.record.attempts[0].detail.length > 0);
  } finally {
    if (saved.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = saved.url;
    if (saved.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = saved.key;
  }
});

test("a provider id that is not in the registry is recorded, not thrown", async () => {
  const outcome = await runChain("text", { prompt: "x" }, {
    providers: [fake("real")],
    chains: { text: ["ghost", "real"] },
    checkHealth: false,
  });
  assert.equal(outcome.ok, true);
  assert.equal(outcome.record.attempts[0].outcome, "skipped");
  assert.match(outcome.record.attempts[0].detail, /not in this registry/);
});
