# AI compute plan — what runs where, and which offer is actually cheapest for us

Researched 2026-09-16 from primary sources: Cloudflare's own pricing and model pages,
plus each provider's published limits. The credential test below was run, not assumed.

## 1. What this machine is

- **No GPU.** `nvidia-smi` is absent and the display adapter is "Microsoft Basic Display
  Adapter" — a virtual device. Any GPU-shaped workload must be hosted or CPU-local.
- **8 GB RAM total, ~5.2 GB free**, and the same box serves the live site. That rules out
  resident multi-GB models: a 12 MP segmentation already takes 4-5 s here, and a Metro
  dev server once starved it into 58 s.

## 2. Cloudflare Workers AI — the numbers that matter

- **Free: 10,000 Neurons/day.** Then **$0.011 per 1,000 Neurons** = **$11 per 1M Neurons**.
  Serverless: no GPU to rent, no idle cost, 86 models listed.
- What the free daily allowance actually buys (converted from Cloudflare's own neuron rates):
  | Workload | Model | Rate | Free tier per day |
  |---|---|---|---|
  | Speech → text | `@cf/openai/whisper` | $0.0005 / audio minute | **~243 audio minutes** |
  | Text → speech | `@cf/myshell-ai/melotts` | $0.0002 / audio minute | **~537 audio minutes** |
  | Image generation | `@cf/black-forest-labs/flux-1-schnell` | $0.0000528/tile + $0.0001056/step | **~150-200 images** |
  | Translation (en↔Indic) | `@cf/ai4bharat/indictrans2-en-indic-1B` | $0.342 / M tokens | **~290k tokens** |
  | Text (cheapest chat) | `@cf/ibm-granite/granite-4.0-h-micro` | $0.017 in / $0.112 out per M | **~2-4M input tokens** |
  | Text (good, cheap) | `@cf/qwen/qwen3-30b-a3b-fp8` | $0.051 in / $0.335 out per M | **~2.2M input tokens** |
  | Embeddings (search) | `@cf/baai/bge-m3` | $0.012 / M tokens | **~8M tokens** |

  Sanity check on a real product: **"Text to voice-over" at ₹99/clip** — 500 words is
  roughly 3-4 audio minutes ≈ $0.0008 (₹0.07) of MeloTTS. **"Reel cover maker" at
  ₹399/mo** — 20 flux images a month ≈ $0.01. These are ~99% margin products priced at
  ₹49-399.

## 3. The alternatives, for honesty

| Provider | Free tier | Note |
|---|---|---|
| Cloudflare Workers AI | 10,000 neurons/day, then $11/1M neurons | Only verified source of **cheap image + ASR + TTS + Indic translation** in one account we already use |
| Google Gemini API | ~1,500 requests/day on Flash, 10 RPM | Best free text baseline; Pro models moved behind billing; free tier data improves Google products |
| Groq | 30 RPM / 6k TPM / 1,000-14,400 req/day, no card | Fastest tokens/sec, text only |
| Cerebras | ~1M tokens/day | Large prompts |
| Local CPU on this VM | ₹0 | Only for what already fits: pdfcpu, rembg, Pillow |

## 4. Routing rule — what stays local, what goes hosted

**Stays on CPU here (₹0, no upload):**
- PDF work (pdfcpu): merge, split, compress, rotate, page numbers
- Segmentation (rembg): passport cut-out, background remover
- Compositing + watermarking (Pillow): the passport sheet, previews, crops

**Goes to Workers AI (no GPU here; bursty workloads favour per-request):**
- Every text product: caption / bio / application writers, study helper (→ granite or qwen3-30b)
- Hindi ↔ English document translation (→ indicTrans2, purpose-built)
- Subtitles for reels, lecture/meeting → notes (→ whisper, $0.0005/audio minute)
- Voice-over (→ MeloTTS)
- Room redesign, reel/thumbnail covers (→ flux-1-schnell / flux-2-klein)

**Never buy a GPU** for these volumes: a rented GPU is $0.30-2.00/hour whether or not a
customer shows up; at our usage the free allowance covers development and paid usage
lands in single-digit dollars per month.

## 5. The one blocker, proven

We hold **R2 (S3) credentials only**. Tested with the R2 access key just now:

```
POST /client/v4/accounts/<acct>/ai/run/@cf/openai/whisper
→ {"success":false,"errors":[{"code":10000,"message":"Authentication error"}]}
```

Fix (2 minutes, in the Cloudflare dashboard): **My Profile → API Tokens → Create Token →
"Workers AI" template**, scope it to the account, then set `CLOUDFLARE_AI_TOKEN` in
`apps/web/.env` (the account id is already there as `CLOUDFLARE_R2_ACCOUNT_ID`).

**House rule:** the token stays **server-side**. It must never become a `NEXT_PUBLIC_*`
value or ship in the Expo bundle — every AI call goes through `/api/job` or a new
`/api/ai/*` route so cost stays metered per product, exactly like the paid jobs are today.
