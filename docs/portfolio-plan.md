# Portfolio Integration & Architecture Plan

## 1. Executive Principles

1. **Independent Products, Shared Plumbing**: 
   - Projects do not get mashed into a single monolithic codebase. 
   - Standalone products (Droply, DropBy, RewardJar, Gatted, Cycle Tracker, CashCard) keep their own identity, repository, and custom domains.
   - The Marketplace serves as a **Plumbing-as-a-Service Platform**:
     - Unified WhatsApp OTP Auth (`apps/web/app/api/otp`, Nextel).
     - Global R2 file storage (`apps/web/lib/r2.ts`).
     - Centralized Python async execution engine (`services/tools/worker.py` on VM via `/api/job`).
     - Payment & monetization rails (Razorpay unlock routes + AdMob rewards).
     - Developer & compliance portal (`apps.dropby.co.in`, privacy policies, app-ads.txt).

2. **Droply Stays Standalone**:
   - `Dinehub1/Droply` is a dedicated P2P WebRTC file-sharing product.
   - It will **not** be integrated as a sub-page of Toolbox web; it gets its own domain and standalone deployment, consuming shared auth/R2 services as needed.

---

## 2. Product Matrix & Repository Mapping

| Product / Family | Canonical Repo / Source | Deployment Surface | Shared Plumbing Used | Next Strategic Action |
| :--- | :--- | :--- | :--- | :--- |
| **Droply** | `Dinehub1/Droply` | Standalone Web (`droply.in` or custom) | WhatsApp OTP, R2 fallback | Deploy independently; retire `Sharing-` |
| **DropBy (Dining & Events)** | `DropBy` (Expo) + `Dropy-web` + `Dinehub-super-admin` | App + Web Tenant (`Swaad Ghar`) | Edge Functions, Razorpay, Auth | Resolve trademark naming clash with `dropby.co.in` |
| **QR Menu / Ordering** | `Quickdine_2` / `dine-easy-saas` | Standalone SaaS / Shop Toolkit | Supabase, R2 for menus | Run side-by-side audit to pick canonical repo |
| **RewardJar (Wallet Passes)** | `rewardjar-5.0` (Monorepo) | Standalone SaaS + Shopify App | Apple/Google Pass generation APIs | Archive older v1–v4 versions; integrate pass generator in Shop Toolkit |
| **CashCard (Venue Wallet)** | `cashcard-v15` | Dedicated Capacitor App / B2B | Docker offline mode, custom backend | Keep B2B isolated; brand listing under Kadam Pay |
| **Gatted (Gated Community)** | `Gatted-2026` + `Gattedsuperadminpanel` | Dedicated App + Admin Panel | Supabase (separate schema) | Rotate leaked Nextel key; purge `.env` from repo history |
| **Cycle Tracker** | `Cycle-Tracker-App` | Dedicated App (Wellness Family) | Client-side SQLite/AsyncStorage | Remove duplicate copy in `caoffee-shop`; audit sensitive health data policy |
| **Quit Smoking** | `somkefree` | Dedicated App (Wellness Family) | Local state / Notification scheduler | Target check against Apple 4.3 guideline |
| **Water Reminder** | `Ai-water-reminder` | Feature integration | Marketplace Wellness app | Merge features into existing Wellness app rather than spamming a thin listing |
| **QuickDriver** | `QD APP/Quick_driver` | Client Project (`quickdriver.in`) | Mocked backend / Expo 57 | Client deliverable: keep separate from public repo |

---

## 3. Toolbox Web Architecture (`tools.dropby.co.in`)

### URL & Search Strategy
- **Routing Model**: `tools.dropby.co.in/<tool-slug>` (e.g., `/compress-pdf`, `/bg-remove`, `/invoice-maker`).
- **SEO & Ranking**: Consolidates backlink profile and domain rank into one high-authority domain rather than diluting across unranked subdomains.

### Unified Web Tool Frame (`apps/web`)
A single, reusable React component handling:
1. Drag-and-drop file upload to Cloudflare R2 presigned URLs.
2. Job dispatch to `/api/job` with polling/SSE progress updates.
3. Preview rendering (watermarked for premium tools, full for free tools).
4. Unlocking flow (Razorpay payment or WhatsApp OTP verification).
5. File download trigger.

### Phased Rollout Waves
* **Wave 1: Free & Proven (Zero Infrastructure Cost)**
  - `compress-pdf`, `merge-pdf`, `split-pdf`, `rotate-pdf`, `page-numbers-pdf`
  - `photos-to-pdf`, `collage`, `exif-strip`
  - `bg-remove` (Free tier / low res)
* **Wave 2: Monetized & Proven (Requires Razorpay Integration)**
  - `passport-photo`, `invoice-maker` (GST bill), `signature-maker`, `resume-checker`
* **Wave 3: AI Quota Guarded**
  - `translate-doc`, `ai-image` (Cloudflare Workers AI with 10k daily neuron cap)
  - `resume-builder`, `subtitles`, `voiceover`
* **Wave 4: New Engines**
  - `bank-statement-to-excel` (adapted from `excel-wizard-bank-buddy`)
  - `card-maker`, `marksheet-maker`, `worksheet-maker`

---

## 4. Trading Strategy & Open-Source Ingestion

### A. Strict Regulatory Boundary (SEBI)
- **Allowed on Public Marketplace (PaisaFlow / Loan Saathi)**:
  - Brokerage, STT, and capital gains tax calculators.
  - Position sizing and risk management tools.
  - Personal trade journal (manual or broker CSV/P&L import).
  - Quantitative portfolio analytics via `quantstats` (tearsheet generation).
  - Raw charts and market screeners (`tradingview/lightweight-charts`, `pkjmesra/PKScreener`).
- **Prohibited on Public Marketplace**:
  - Algorithmic buy/sell signals, copy-trading, or retail automated execution without formal SEBI RA/IA licensing.

### B. Private Trading Desk Architecture
- **Infrastructure Separation**: Migrate MT5 live runtime, Kotak Neo bot, and DeltaEX processes away from `exness-vm` (which serves production web traffic) onto a dedicated trading VPS.
- **Unified Engine (`trading-core`)**:
  - Broker abstraction: `marketcalls/openalgo` (multi-broker Indian layer), `zerodha/pykiteconnect`, `dhan-oss/DhanHQ-py`.
  - Crypto & Prediction: `ccxt/ccxt`, `pmxt-dev/pmxt`.
  - Backtesting & Execution: `nautechsystems/nautilus_trader` (bridges backtest and live execution).
  - Analytics & Risk: `ranaroussi/quantstats`, `bukosabino/ta`, `TA-Lib`.
  - Research Agents: `TauricResearch/TradingAgents`, `OpenByteInc/QuantDinger` (integrated with Jev decision model).

---

## 5. Implementation Roadmap

### Phase 0: Security Scrub & Version Audit (Current Step)
- [ ] **Security**: Rotate Nextel API key in Nextel console.
- [ ] **Security**: Purge `.env` from `Dinehub1/Gatted-2026` repo and scrub git history.
- [ ] **Audit**: Side-by-side comparison of QR Menu repos (`Quickdine_2` vs `dine-easy-saas` vs `Clickmenu`).
- [ ] **Audit**: Side-by-side comparison of Gatted repos (`Gatted-2026` vs `Gatted_app`).
- [ ] **Clean-up**: Archive legacy prototypes on GitHub (older RewardJar versions, duplicate copies).

### Phase 1: Toolbox Web Wave 1 Foundation
- [ ] Implement `ToolFrame` layout in `apps/web`.
- [ ] Create tool registry config (`tool-catalog.ts`).
- [ ] Wire `/api/job` integration for Wave 1 PDF tools and background remover.
- [ ] Deploy dynamic sitemap and SEO meta tags for `tools.dropby.co.in`.

### Phase 2: Core App Strengthening & Web Tenants
- [ ] Fill Shop Toolkit using vetted components from `rewardjar-5.0` (digital card) and canonical QR menu.
- [ ] Add `excel-wizard-bank-buddy` parser as a dedicated tool.
- [ ] Bring verified web tenant sites live under the multi-tenant router.
