# QuickDriver — Project Context

> Master context for the QuickDriver product build. Keep this current; it is the single source of truth for scope, stack, and integrations.

## 1. What this is
**QuickDriver** (quickdriver.in) — the client's own on-demand **"hire a driver for your own car"** service (DriveU model, not Uber's car-supplying model). Based in **Indore**, expanding to **Bhopal & Ujjain**. We are building a complete, modern 3-role platform to replace/upgrade their current site + apps.

**Positioning vs. their current system:** they assign drivers manually in 15–20 min, have no upfront dynamic fares, and a weak promotions engine. Our build fixes all three: **auto-dispatch within minutes**, **upfront itemised fares**, and a full **promotions + rewards** engine — plus our signature differentiator, the **mandatory 30-second car video before & after every trip** (damage-dispute protection).

## 2. Services offered (from quickdriver.in)
Instant Ride · Hourly Driver · Daily/Full-day Driver · Night Driver (₹150 surcharge 10 PM–6 AM) · Outstation (MP-wide) · Corporate (monthly billing). Cash / UPI / wallet. Optional ₹100 trip insurance. Police-verified drivers, 24/7, 4.9★, 1,000+ rides. Helpline +91 88890 91011.

## 3. Tech stack (what we already have running)
- **Built by:** **Brand Collabs** (the user's company). Growth powered by the **Auto-C Meta Agent** (Brand Collabs' proprietary Meta marketing automation).
- **Mobile:** React Native (Expo SDK 57), expo-router (typed routes, React Compiler), RN 0.86, React 19.2, TS 6. Chosen over Flutter mainly for first-class Meta SDK/Pixel/CAPI integration + JS talent pool.
- **Website & Admin:** **Next.js + Tailwind CSS** (responsive on web/tablet/mobile). (Prototype admin currently runs on Expo web; production admin is Next.js.)
- **UI:** Outfit font (brand), amber `#F1B021` + navy `#172238` brand kit, shared primitives (Button/Card/Row/Chip/ThemedText/ThemedView).
- **Native modules:** expo-camera (30-sec car video), expo-audio (Uber-style ride-alert sounds), expo-image.
- **Verification:** OTP via SMS, optionally **WhatsApp Business API** (through Auto-C's WhatsApp agent).
- **Planned backend:** **Supabase / PostgreSQL + Redis** (PostGIS geo, Realtime live location, Auth OTP, Storage for videos, Redis cache/dispatch queue) · Razorpay/RazorpayX (UPI + payouts) · expo-notifications (push).
- **Marketing platform:** **Auto-C** (`/Users/mac/Documents/Devlopments/Auto-c`) — multi-tenant Meta/Google automation. Meta Ads campaign building, CRM→Custom-Audience sync (SHA-256 hashed), per-client Meta credentials.

**Engagement terms** (in proposal): Deliverables = 1 mobile app (Customer & Partner) + Admin console + backend APIs + source & docs + staff training. Revisions = 3 rounds design / 2 rounds functionality, 72-hr response, extra billed. Payment = 30% upfront / 30% design approval / 30% dev complete / 10% launch. Warranty = 45-day bug fix + 9-month security updates.

## 4. The three apps (built, running on mocks)
- **Customer** — `src/app/(tabs)/` Home, Trips, Rewards, Profile + `src/app/booking/{new,trip}`. OTP login, service picker, upfront fare estimate, live trip tracking, SOS, wallet, promos, referrals, ratings/tips.
- **Driver** — `src/app/(driver)/` Duty, Earnings, Account. Online/offline, **Uber-style ride popup with sound + 15s countdown**, navigate, OTP-verified start, **30-sec pre & post car video (real camera)**, earnings, KYC.
- **Admin** — `src/app/(admin)/` Live ops, Drivers (verification queue), Pricing/promos, Analytics.

Role chosen at login; routed via `Stack.Protected` on `role` from the single `useApp()` store (`src/lib/app-context.tsx`). Demo OTP `1234`. All data is in-memory mock until the backend lands.

## 5. Meta Pixel + Auto-C integration
QuickDriver onboards as a **tenant in Auto-C**. Because the app is React Native:
- **Web build** → browser **Meta Pixel** (client-side).
- **Native app** → **Conversions API (CAPI)**: app → Auto-C `/events` router → Meta. Shared Pixel/Dataset ID + `event_id` dedupes web vs. CAPI.
- Events: CompleteRegistration (OTP), Schedule/InitiateCheckout (booking), Purchase (trip paid, value+INR).
- Reuses Auto-C `meta_creds.py` (per-client token) and `audience_sync.py` (hashing) → Custom Audiences + lookalikes → **2 running ad campaigns** (see proposal).

**Need from client:** Business Manager partner access, Pixel ID, CAPI token, Ad Account ID, Page ID, domain verification of quickdriver.in, consent sign-off.

## 6. Indexing / token efficiency
Repo is indexed in **codebase-memory-mcp** (project `Users-mac-Documents-Devlopments-QD-APP-Quick_driver`, persisted `.codebase-memory/graph.db.zst`). Query the graph before reading files. Persistent memory files live under the project memory dir (project-overview, roadmap-backend, app-context-state, car-video-feature, codebase-graph-indexed).

## 7. Roadmap (priority order)
1. Supabase backend + realtime (replace mocks) → 2. Maps + GPS (dev build) → 3. Auto-dispatch engine → 4. Razorpay payments + payouts → 5. Push notifications → 6. Upload car videos to Storage → 7. Meta CAPI events endpoint in Auto-C + 2 ad campaigns → 8. 2026 edge: surge, AI ETA, fraud, chat masking, scheduled rides, corporate portal.
