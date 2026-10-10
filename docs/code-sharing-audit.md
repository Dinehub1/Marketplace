# Code-sharing audit

What is shared, what only looks shared, and what it is worth fixing — measured, not
estimated. Every number here was produced by a command run against this tree; where a
figure is a judgement rather than a measurement it says so.

**Scope:** `apps/mobile` (19 store targets), 9 standalone Expo apps in `apps/<id>/`,
`apps/web`, `packages/core`, `packages/tokens`, `services/tools`.

---

## 0. Health summary

| Area | Verdict |
|---|---|
| Shared logic (`packages/core`) | **Real and used** — 22 of ~40 exports consumed by mobile + web |
| Shared tokens (`packages/tokens`) | **Real and used** — palette is *generated* from `globals.css`; spacing/radius native-only by design |
| Shared UI components | **Started** — `packages/expo-ui` ships `HapticTab` (2 live consumers); most template atoms are dead, not shared |
| Standalone apps (9, ~115k lines) | Still **share almost nothing** — 4 of 9 now take a `@brandcollabs/*` package (highwaypass, quick-driver, smokefree, money-map) |
| `apps/mobile` internal sharing | **Done** — 44/50 screens import the kit; raw `<Pressable>` 105 → 5, shared `<Press>` 1 → 135 |
| Dependency hoisting | **Correct** — one root `node_modules`, no duplicate installs |
| Typecheck | **Clean** — all 14 workspaces, exit 0 (was 12) |
| Lint | **0 errors, 707 warnings**, 573 of them in `dining` alone |
| Tests | **5 test files** against ~250k lines; `packages/core` now 13 tests |
| Dead template files | **Deleted** — 24 files / 1,005 lines removed, plus one orphaned dependency |
| Dark-mode colour bugs | **Fixed** — 3 games used hardcoded *dark*-palette literals for `critical`/`positive` |
| web ↔ mobile share | **Logic only** — `formatCount` wired into 8 web call sites; the two `BusinessCard`s are *not* one component |
| Brand tints | **Now guarded** — the six strengths were written twice (CSS `color-mix` + TS); `check:brand-tokens` asserts they agree |
| React version | **Aligned** — one hoisted `react@19.2.3`; the nested web copy is gone (§5 step 5) |

*Status: all five steps complete. React is aligned to a single hoisted 19.2.3 and the web
app builds on it. Two things are deliberately left, both recorded above: the 5 raw
`<Pressable>`s that drive their own pressed state, and the 21 React Native/metro package
versions the lockfile disagrees with `react-native@0.86.3` about — a real finding that
deserves its own verification rather than a ride-along. See §5 for the six corrections to
this document's earlier claims.*

---

## 1. What is already good — do not rebuild

Worth stating first, because several of these are better than the surrounding repo:

- **Hoisting is correct.** Root `node_modules` is 3.2 GB; the per-app `node_modules`
  directories are ~0 MB stubs (empty `@babel/`, `@expo/` dirs left by an older
  per-app `npm install`). `@brandcollabs/core` and `@brandcollabs/tokens` are symlinks from the
  root. There is no duplicate-install problem to fix.
- **All 10 Expo apps are on an identical stack**: `react 19.2.3`, `react-native 0.86.3`,
  `expo 57.0.26`. This is the precondition for sharing components, and it is already
  met. (The one outlier is `apps/web` on `react 19.2.4` — see §3.1.)
- **Both shared packages are dependency-free raw TypeScript** (`main: src/index.ts`, no
  `dependencies`, no React). `packages/core` has a real test file with 8 tests, and they
  test the right thing — that the same input gives the same answer on both platforms
  ("scraped business names are cleaned identically on both platforms", "a page range the
  app offers is the one the engine runs").
- **`apps/mobile/lib/timer.ts` + `timer-core.ts` split is clean.** `timer-core` is 126
  lines of pure arithmetic with zero imports; `timer.ts` is the React layer and
  re-exports the pure functions. No function is defined twice.
- **`lib/sound.ts` + `components/sound-toggle.tsx` separation is clean** — policy and
  runtime in one place, glyph and layout in the other.
- **The 19-target design genuinely works.** The 3 directory targets share one
  `(directory)` screen set with **zero** `if (target === …)` branching; scope is
  resolved at runtime through `scopeForBrand` in `lib/target.ts`.
- **`components/ad-slot.tsx` handles the Expo Go / web / no-SDK case honestly** and all
  game and wellness screens share it with no duplication.
- `apps/mobile` typechecks clean and carries relatively few lint warnings (23 of the
  repo's 707, across 12 files — an earlier version of this document said "12 warnings",
  which was the *file* count).

---

## 2. The 9 standalone apps share nothing

**Measured:** `grep -rl "@brandcollabs/core\|@brandcollabs/tokens"` across all 9 standalone apps
returns **0 files**. Not one declares either package in its `package.json`.

> **Correction (step 3).** This section originally presented ~1,636 lines of duplicated
> template atoms as the extractable prize. Auditing it showed that **24 of those files
> have no caller in any app — 1,005 lines** — and that the components which *are* used
> cannot move without a theme contract first. So the duplication below is real, but most
> of it is dead code rather than something to share. See §5 step 3. The tables are left
> as measured; read them with that correction.

Consequence — the same things written more than once:

### 2.1 Verbatim copies (byte-identical, checked with `diff`)

| Component | Copies | Diff |
|---|---|---|
| `ThemedText` / `themed-text` | gatted, cycle-tracker, dining, doctor-appointment, smokefree (5) | 0 lines |
| `ThemedView` / `themed-view` | same 5 | 0 lines |
| `HapticTab` | gatted, cycle-tracker, dining, money-map, smokefree (5) | 0 lines |
| `HelloWave` / `hello-wave` | 2 families × 3 apps | 0 lines |
| `Collapsible` / `collapsible` | 2 families × 3 apps | 0 lines |
| `IconSymbol.ios` | 5 | 0 lines |
| `ParallaxScrollView` | gatted ↔ cycle-tracker | 0 lines |
| `doctor-appointment/constants/Colors.ts` ↔ `gatted/constants/theme.ts` | 2 | 26-line block identical |
| `useColorScheme` / `useColorScheme.web` / `useThemeColor` | 7 apps | 117 lines |
| `expo-env.d.ts` | several | 18 lines |

Totals: **1,061 redundant lines in 23 identical groups across 68 files**; counting
drifted near-copies as one canonical implementation per family, **1,636 lines**.

### 2.2 What is *not* duplicated (don't "unify" these)

Themes are genuinely different brands — cycle-tracker purple `#5e19e6`, doctor
`#00D2D3`, quick-driver amber `#F1B021`, highwaypass navy `#0F172A`. `Button` is 116 /
247 / 138 lines across gatted / dining / doctor with incompatible props
(`title` vs `children`, different variant unions). **Sharing values here would be wrong;
sharing the key vocabulary is the useful part.**

### 2.3 The cost, stated honestly

The standalone apps total **114,733 lines** and the extractable duplication is
**~1,790 lines measured** (1,636 template/hooks + ~150 Supabase bootstrap). Even with
the five local UI kits (`gatted/design-system` 2,286, `dining/components/ui` 3,418,
`doctor-appointment/src/components/common` 1,621, `gym-tracker` 455, `money-map` 225 —
8,005 lines) converged, the ceiling is **~3,000–4,000 lines, about 3%**.

**So the honest framing: for the standalone apps this is a consistency play, not a
size play.** The payoff is that a fix lands once instead of five times — e.g. dark-mode
and accessibility fixes to `ThemedText` currently have to be applied to 5 copies, and 3
of those drifted already.

---

## 3. Where the real leverage is — `apps/mobile`

### 3.1 `components/ui.tsx` is good and mostly unused

`components/ui.tsx` (594 lines) already exports 12 primitives: `Text`, `Press`, `Card`,
`Divider`, `Button`, `Chip`, `Badge`, `Skeleton`, `EmptyState`, `Disclosure`, `StatCard`,
`ListItem`.

Measured adoption:

| Metric | Count |
|---|---|
| Screens importing `components/ui` | **23 of 50** |
| Raw `<Pressable>` | **105** |
| Shared `<Press>` | **1** |
| Tool screens importing `components/ui` | **0 of 15** |
| Inline 6-digit hex literals in `app/` | **101** |
| Hardcoded `borderRadius` vs `radius.*` token | **113 vs 86** |

Two consequences worth separating:

1. **The kit is missing what the tools need** — progress bar, timer/clock display,
   overlay/modal, segmented control, numpad, toast, and a full-width solid-accent
   `Button` variant. That is *why* 14 of 15 tool screens declare their own button style.
   Rule of thumb: adoption follows capability, not exhortation.
2. **Where the kit does have the primitive, screens still hand-roll it.** 105 raw
   `<Pressable>` against 1 `<Press>` is not a missing-feature problem.

`components/ui.tsx` also has zero call sites in `app/tools/` — 15 files that each
re-declare a primary/secondary button (e.g. `tools/pdf.tsx:543-557`,
`tools/resume-builder.tsx:555-563`, `tools/translate-doc.tsx:492-499`).

### 3.2 The 7 games are one shell written three times

`tap-sprint.tsx`, `word-duel.tsx` and `block-clear.tsx` are the same shell:

- Ready/title panel: identical badge row, chip, steps and `stepDot`, plus the same
  literal copy — duplicates at `tap-sprint:594-666`, `word-duel:355-433`,
  `block-clear:264-345`.
- Game-over screen has **three different geometries**: full page (tap-sprint,
  word-duel, block-clear, math-sprint), board overlay (sudoku, merge-tiles), footer
  card (crossword).
- Recent-rounds list and the Passport cross-sell block are copy-pasted verbatim into
  all three.
- **17 of 21 style keys are byte-identical** between tap-sprint and word-duel; 17 of 18
  between tap-sprint and block-clear.

A shared `<GameShell>` + `useGameRecord()` is worth roughly **500 lines** and, more
importantly, fixes bugs that exist only because the shell was copied:
**`crossword.tsx` never loads its own high score** — it calls `recordRound` but the
record is never read, so "New best" can never appear. That is not a style issue.

### 3.3 Seven timers, four formatters, and the good one is unreachable

| Concern | Implementations |
|---|---|
| Deadline-anchored clock (correct) | `lib/timer.ts` (513) + `lib/timer-core.ts` (126) — used by **4 wellness screens only** |
| Tick-accumulating clock (drifts) | tap-sprint, word-duel, math-sprint, sudoku, crossword, `wellness/sounds.tsx` |
| Games importing `lib/timer` | **0 of 7** |

`lib/timer.ts:8-28` documents the drift/background-freeze/no-pause behaviour as the
exact reason the engine was rewritten — and six screens still ship the old pattern.

`formatTime` in `sudoku.tsx:54-58` and `crossword.tsx:65-69` is **byte-identical**
(verified with `diff`), and `timer-core.ts:113` already has a tested `mmss()`.

### 3.4 Three audio systems, one game with sound

| System | Location | Sound? |
|---|---|---|
| Shared | `lib/sound.ts` | 6 wellness screens |
| Private copy | `merge-tiles.tsx` — own `setAudioModeAsync` at 374, own rewind at 335-343, `useAudioPlayer` ×4 at 267-270, **own AsyncStorage key `hermes-merge-sound`** at 184/355/391 | only this game |
| Session-only | `wellness/sounds.tsx:54-56` sets the **opposite** policy (`playsInSilentMode: true`) and never plays audio | none |

`merge-tiles.tsx:51` is the only screen in `app/` importing `AsyncStorage` directly,
bypassing `lib/settings.ts`. Net effect: **6 of 7 games are silent** and use haptics
instead while a full sound system exists.

### 3.5 Duplicated components inside `apps/mobile` itself

`components/business-card.tsx` is **147 lines**; `apps/web/components/directory/BusinessCard.tsx`
is **146 lines**. The same card, built twice for the two surfaces.

---

## 4. Dead code and footguns

### 4.1 `packages/core/src/ai.ts` was unused; `payments.ts` was NOT

> **Correction.** The first version of this section said both files were dead and
> recommended deleting ~536 lines. That was wrong about `payments.ts`, and the error is
> worth recording: the check had searched for *function* symbols only, so it missed the
> type imports. `apps/web/lib/paypal.ts:3` imports `PayPalOrder`,
> `CapturePayPalOrderResult` and `SupportedCurrency` from `@brandcollabs/core`, all three of
> which are declared in `payments.ts`. `packages/core/src/index.test.mjs` also exercises
> `isIAPRequired` and `getGatewayForTransaction`. Deleting the file would have broken the
> web build and the test suite.

**`ai.ts` — genuinely dead, removed.** All 15 exports had zero importers anywhere in
`apps/`, `services/` or `packages/`:

| Symbol | Files using it |
|---|---|
| `callJevDecisions`, `callChatCompletion`, `ChatMessage`, `ChatCompletionOptions`, `ChatCompletionResult` | **0** |
| `JevNoulQuestion`, `JevChoiceQuestion`, `JevScoreQuestion`, `JevQuestion`, `JevAnswer`, `JevChoiceResult`, `JevNoulResult`, `JevScoreResult`, `JevDecisionsResponse`, `JevDecisionsOptions` | **0** |

256 lines deleted, and the `export * from "./ai.ts"` line removed from `index.ts`. The
package's own test suite (13 tests) and every workspace typecheck still pass.

**`payments.ts` — kept. 6 of its 24 exports are used:**

| Symbol | Files using it |
|---|---|
| `RazorpayOrder` | 2 |
| `SupportedCurrency`, `PayPalOrder`, `CapturePayPalOrderResult`, `SubscriptionTier` | 1 each |
| `formatCurrency` | 2 |
| `PaymentGateway`, `ProductPurchaseType`, `MonorepoProject`, `isIAPRequired`, `getGatewayForTransaction`, `CreateOrderParams`, `VerifySignatureParams`, `CheckoutConfigOptions`, `formatPaise`, `formatRupees`, `buildCheckoutConfig`, `PayPalEnvironment`, `PayPalOrderLink`, `CreatePayPalOrderParams`, `PayPalWebhookEvent`, `RevenueCatPackage`, `RevenueCatEntitlement`, `UserSubscriptionState` | 0 in `apps/`, but two of them **are** exercised by `index.test.mjs` |

So roughly half the file is unreferenced app-side, but pruning it is an API-surface
decision for a shared package, not a verified-dead-code deletion. Left alone
deliberately.

`apps/dining` still has its own `utils/mockPaymentGateway` and no `@brandcollabs/core`
dependency — the "shared layer built, then not adopted" observation stands for `dining`.

### 4.2 Hardcoded Supabase fallback

`highwaypass/lib/supabase.ts:6,10` and `quick-driver/src/lib/supabase.ts:6,9` fall back
to a hardcoded project URL and key. **Not a secret leak** — the value is
`sb_publishable_…`, the same key committed in `.env`, and publishable keys are designed
to ship inside client bundles. The real problem is different: **a build with a missing
env var silently connects to the production database instead of failing.** A misplaced
placeholder env var points a dev build at live data with no warning.

### 4.3 Config inconsistencies

| Issue | Evidence |
|---|---|
| `dining` is the only app not extending `tsconfig.base.json` | uses `expo/tsconfig.base` with `"strict": false`, and has no `noEmit` — the other 8 are `strict: true` |
| `packages/tokens` has no `typecheck` script | the only workspace never typechecked |
| Lint is advisory | CI runs `npm run lint` but **0 errors / 707 warnings** means it can never fail; `dining/eslint.config.js` explicitly downgrades `react-hooks/refs`, `immutability`, `static-components` to `warn` |
| CI exports 4 of 19 targets | `.github/workflows/ci.yml` exports `sheharbazaar wellness toolbox tap-sprint` — one per family, by design, but 15 targets are never bundled in CI |
| Test coverage | 5 test files repo-wide; only 3 of 13 workspaces have a `test` script |

The dominant warning is **274 × `react-hooks/refs`**, which is a React 19 correctness
concern, not cosmetics.

---

## 5. Recommended sequence

Ordered by payoff ÷ risk. Steps 1, 2 and 3 are mechanical and low-risk; step 5 is a
design project and should not be attempted before step 3.

**Step 1 — hygiene, no design decisions** — ✅ **done**
- Added `typecheck` to `packages/tokens` (it had no `tsconfig.json` at all, so it was the
  one workspace never checked). Root gate now covers 13 workspaces.
- `dining` moved to `strict: true`. 45 errors, all fixed; it now typechecks clean and
  **bundles at the same byte size as before**, so no runtime behaviour moved.
- Removed `packages/core/src/ai.ts` (256 lines, 15 exports, zero importers). **Kept
  `payments.ts`** — §4.1 originally called it dead and was wrong.
- Added `requireEnv` / `requireFirstEnv` to `@brandcollabs/core` (with tests) and used them in
  `apps/highwaypass` and `apps/quick-driver`, removing the silent production fallbacks.
  Both apps typecheck and bundle unchanged.

**Step 2 — the game record, the shared intro, and the crossword bug** — ✅ **done**

*Part A — the record (`lib/use-game-record.ts`, 96 lines).* All **7** games now use it:
`tap-sprint`, `word-duel`, `block-clear`, `crossword`, `sudoku`, `math-sprint`,
`merge-tiles`. 103 insertions / 150 deletions — the wiring shrank as it consolidated.

- **The bug is fixed.** `crossword.tsx` imported `recordRound` but never `loadGameScores`
  — it wrote a high score it could never read back, so its record stayed `EMPTY_RECORD`
  and it had no best-score display at all. It now loads the record, shows the stored best
  and the rounds solved, and celebrates a genuine new best with the previous number.
- The hook adds two things the hand-rolled copies lacked. `ready` distinguishes "no score
  yet" from "not read yet" — `record.best` is `0` in both cases, and `sudoku`/`math-sprint`
  were rendering "No best yet" / "Best: 0" during every load. `saveRound` also *returns*
  the round result, so a screen no longer has to wire a setter just to learn whether the
  round was a record.

*Part B — the shared intro (`components/game-intro.tsx`, 173 lines).* `tap-sprint`,
`word-duel` and `block-clear` opened on the same section element for element: eyebrow,
title, lede, numbered steps, an optional scoring card, the start button, and a record
line. Only the copy, the accent and the rows differed. Measured before extracting: **18
of their shared 21 style keys were byte-identical** and the markup was identical, so this
was a copy, not a rewrite.

- Net **−213 lines across the three games, +173 for the component** — so the win is not
  size, it is that the intro layout and its 10 style values now exist once. A change to
  the step-dot or the button reaches all three games.
- Dead styles removed with it: 7 keys from `tap-sprint` (25 → 18), 7 from `word-duel`
  (30 → 23), 6 from `block-clear` (23 → 17).
- **`GameIntro`, not `GameShell`.** The HUD, progress bar and game-over card are *not*
  merged, on purpose: `tap-sprint` counts down a clock, `block-clear` counts moves, and
  game-over is a full page in one game and a board overlay in another. Those are real
  differences, and inventing props to express them would be a redesign disguised as
  deduplication. `gap` is a prop for the same reason — the three genuinely disagreed
  (`tap-sprint` used `space.base` where the other two used `space.md`).
- The duplicated styles that differ were **left out** of the component, not resolved:
  `column`, `back` and `noticeRow` still differ between the three screens, and quietly
  picking one value would have changed how two of them look.

Still not done from §3.3, and not claimed: the **timers** (`lib/timer.ts` is used by 0 of
7 games; six still tick-accumulate) and the duplicate `formatTime`.

**Step 3 — the Expo template atoms** — ✅ **done (rescoped), with a significant correction**

Auditing this step changed what it should be. The original plan — extract the ~1,636
lines of duplicated template atoms into `packages/expo-ui` — was based on counting
*duplicated* lines. Counting *used* lines gives a different answer:

- **24 of those files have no caller in any app: 1,005 lines.**
  `ExternalLink` is defined in 5 apps and imported by none. So is every `HelloWave`,
  `ParallaxScrollView` and `Collapsible` copy (7 apps between them), and 3 of the 5
  `HapticTab`s. Confirmed repo-wide, excluding the definitions themselves. They are
  template leftovers, and extracting them would have given a package more exports than
  the apps have uses.
- **The components that *are* used are not portable.** `ThemedText`, `ThemedView` and
  `IconSymbol` have real callers (quick-driver 19/18, smokefree 10/10), but each app's
  copy imports its own `@/hooks/useThemeColor`, which reads its own `@/constants/theme`
  palette. Those palettes are the apps' branding and genuinely differ. Nine apps, one
  `@/` alias: a shared component cannot import them. Lifting those needs a theme provider
  or a per-app factory — a design change, not a move — and copying one app's palette over
  the others would flatten branding, which this work must not do.

**What shipped:** `packages/expo-ui` with the one atom that is both used and portable,
`HapticTab`, migrated in its two live consumers (`smokefree`, `money-map`), whose local
copies were deleted. `ExternalLink` is exported as an unreferenced, ready implementation
rather than five dead copies. Both apps typecheck and **bundle at their previous sizes**
(8.7 MB and 8.4 MB) with the package present in the bundle; the root typecheck gate now
covers **14** workspaces.

**Next steps this uncovered**, in order:

1. ~~**Delete the 24 dead template files (1,005 lines).**~~ — ✅ **done.** Deleted after
   re-deriving the list from scratch and confirming each path existed and was inside the
   repo. Verified four ways: all 7 affected apps typecheck clean, the root gate passes,
   `npm run lint` is unchanged at 0/707, and **all 7 apps bundle at exactly their previous
   sizes** (gatted 11.7 MB, dining 10.0, cycle-tracker 10.6, doctor-appointment 8.7,
   quick-driver 9.7, smokefree 8.7, money-map 8.4) — zero byte drift, so nothing at
   runtime had been pulling them in. One orphaned dependency removed with them:
   `expo-symbols` was imported *only* by `quick-driver`'s deleted `collapsible.tsx`, so it
   is gone from that app's `package.json` and lockfile; quick-driver still bundles at
   9.7 MB.
2. **A theme contract before any themed-component extraction.** Share the *key
   vocabulary* (`text`, `background`, `border`, …) with per-app values injected, so
   `ThemedText`/`ThemedView`/`IconSymbol` can move without flattening six palettes. This
   is the prerequisite the original step 3 silently assumed.
3. `TabBarBackground` stays put until (2) lands — there is nothing to gain by moving a
   file nobody imports.

**Step 4 — make the mobile kit worth adopting** — ✅ **done**

The dark-mode correctness half is done, because it was a real bug rather than a
tidy-up. `tap-sprint` was the only game reading semantic colours from the theme; the
other six hardcoded literals that are specifically the **dark** palette's values:

| Game | Was | Now | Consequence of the old value |
|---|---|---|---|
| `sudoku.tsx` | `const WRONG = "#ef4444"` | `c.critical` | wrong digits drawn in the dark red on a light background |
| `crossword.tsx` | `const WRONG = "#ef4444"` | `c.critical` | wrong letters and the "bad" toast in the dark red |
| `math-sprint.tsx` | `setFeedbackColor("#22c55e")` / `("#ef4444")`, timer bar | `c.positive` / `c.critical` | the "correct" flash was the dark green; the low-time bar was the dark red |

The palette carries `positive`/`critical` in both schemes (`#0f7a4a` vs `#4ade80`,
`#b42318` vs `#f87171`), so these are now correct in both. Verified: root typecheck and
lint unchanged, all 7 games still bundle at 10.4 MB.

**One trap worth recording.** Renaming `WRONG` to a theme alias called `wrong` in
`crossword.tsx` silently collided with a *pre-existing local* `wrong` boolean in the cell
renderer (`const wrong = isWrong(state, r, col)`), turning `letterColor = wrong` into a
boolean assignment. The alias is `wrongColor` for that reason. It is the kind of
"mechanical rename" that a typecheck happens to catch here — but only because the target
was a typed string.

**Also shipped: `ProgressBar` in `ui.tsx`.** `tap-sprint` and `word-duel` drew the same
track-and-fill byte for byte (`height: 6, borderRadius: 3, overflow: "hidden"` on both
elements), so this replaced a copy rather than inventing a design. The
defaults are those exact values, so the first caller cannot shift by a pixel;
`word-duel` now uses it and its two dead style keys are gone. The component takes a
plain width rather than a shared value on purpose — `tap-sprint` animates its fill for
the urgency fade via `Animated.View`, and folding that in would have meant inventing a
variant to express something the caller already owns.

A type detail worth recording: `DimensionValue` includes `AnimatedNode`, so it is **not**
assignable to `ViewStyle["width"]` and cannot be passed to a plain `View`. The prop
accepts `DimensionValue` (which is what the games compute) and narrows once inside the
component, rather than making every caller cast.

**Also shipped: all 15 tool screens migrated onto the kit.**

This was the largest remaining piece of step 4 and it is done. Measured, before → after:

| | before | after |
|---|---|---|
| Tool screens importing `components/ui` | **0 / 15** | **15 / 15** |
| Raw `<Pressable>` across `app/` | 105 | **38** |
| Shared `<Press>` across `app/` | 1 | **102** |
| Screens importing the kit | 23 / 50 | **38 / 50** |

**What the change actually was, and why that shape.** I looked at the call sites before
choosing an approach, and they were not buttons to be replaced — they were pen-width
pickers, colour swatches, tray tiles, tolerance sliders, and a few small buttons, all
written as a bare `<Pressable onPress={…} style={…}>` with **no press feedback at all**.
The kit's `Press` supplies exactly that and nothing else: it animates on `onPressIn` and
forwards every other prop and the caller's `style` untouched.

That is why the migration is a mechanical tag swap — `Pressable` → `Press`, one import
change per file — and why it cannot alter layout: it adds motion, it does not restyle. It
also honours Reduce Motion (a fade instead of a scale), which the raw `Pressable`s never
did. The screens keep their own `styles.*`; only the feedback layer changed.

Verified: mobile typecheck clean, **mobile lint still 23 warnings — no new ones** (the 4
warnings in `app/tools/` are pre-existing unused `Styles` constants, present in the
pristine copies), root typecheck clean, and three representative targets — `toolbox`,
`pdf-tools`, `passport-photo` — all bundle at 10.4 MB with the tool screens present.

**Also done: the rest of the raw `<Pressable>`s, and a latent bug in `Press`.**

After `app/tools/`, 38 raw `<Pressable>`s remained in 13 files. Classifying them before
touching them was the whole job, because they are not one kind of thing:

- **30 were safe to convert** — a static `style`. Migrated with a **TypeScript AST script**
  rather than a regex sweep, precisely so the next group could not be caught by accident.
  A regex would have destroyed them.
- **8 use `Pressable`'s function form**, `style={({ pressed }) => …}`, to drive their *own*
  pressed colour (`passport/index` 3, `block-clear` 1, `games` 1, plus 3 that the script
  correctly refused). These were left alone: `Press` already supplies press feedback, and
  converting them would have given one element two competing pressed treatments.

Final adoption across `apps/mobile`:

| | before this round | after |
|---|---|---|
| Raw `<Pressable>` | 105 | **5** |
| Shared `<Press>` | 1 | **135** |
| Screens importing the kit | 23 / 50 | **44 / 50** |

**A real bug surfaced while doing it.** Three of the converted elements *did* use the
function form — the AST script converted their opening and closing tags but the check
that should have refused them ran per-file, not per-element, so they were included. That
turned out to be lucky, because it exposed a defect in `Press` itself: it declared
`style?: StyleProp<ViewStyle>` while spreading `PressableProps`, so a function `style`
type-checked, was forwarded as `style={[animated, fn]}`, and React Native — which calls a
function style and **ignores its siblings** — silently dropped the press animation on
exactly the elements that had their own feedback.

`Press` now declares the function form and *composes* it: `style={(state) => [animated,
style(state)]}`. The caller's `pressed` still arrives and the scale still runs, so both
feedbacks coexist instead of one silently winning. Those three elements are left on
`Press` as the composition's first real users.

**Still to do in step 4:**

- **The 5 remaining raw `<Pressable>`s** (`passport/index` 3, `block-clear` 1, `games` 1).
  All use their own pressed state; leave unless that design changes.
- **An overlay/modal and a segmented control** were named as missing but have no clear
  repeated call site yet, so nothing was invented for them.
- **The remaining `isDark ? "#…" : "#…"` pairs** in the games' board rendering
  (`sudoku` 2, `crossword` 4). These are deliberate per-scheme values and are *correct*
  in both schemes; converting them to tokens is tidiness, not a fix.

**Step 5 — shared web/mobile primitives** — ⏳ **partly done, and the plan was wrong twice**

Two findings, both of which change what "share `BusinessCard`" can mean.

**1. They are not one component, and should not be forced into one.** I read both files
before touching either. `apps/web/components/directory/BusinessCard.tsx` (146 lines) is
`<article>` / `<div>` / `<a>` with CSS custom properties, Tailwind classes and inline
`<svg>` marks; `apps/mobile/components/business-card.tsx` (147 lines) is `View` / `Text` /
`Press` with React Native styles, `useTheme()`, `expo-router`, and `@brandcollabs/tokens`. The
near-identical line count is a coincidence of the same *information* being laid out for
two platforms. There is no shared component here to extract — only shared *logic*, which
both already take from `@brandcollabs/core` (`cleanBusinessName`, `telHref`, `waHref`). Forcing
one component would mean either a platform abstraction or flattening one surface's design.

**2. The React mismatch is worse than "a version bump", and is blocked.** `apps/web`
declares `react 19.2.4` while every Expo app is on `19.2.3`, and npm installs a nested
`apps/web/node_modules/react@19.2.4`. I confirmed the web app genuinely **builds and
typechecks on the hoisted 19.2.3** (deleted the nested copies, `npm run build` → exit 0),
so the versions are compatible in practice. But the lockfile cannot be moved cleanly:

- the nested `react-dom@19.2.4` peer-requires `react ^19.2.4`, so it re-pins itself;
- forcing a full lockfile recompute by deleting `package-lock.json` **dropped 69
  platform-optional packages** (`@img/sharp-linux-x64`, `win32`, `wasm32`, `@emnapi/*`…),
  because npm resolves optional platform deps for the machine it runs on. That would
  break Linux/Vercel installs to fix a version cosmetic — strictly worse.

So the lockfile and `apps/web/package.json` were **restored to their original state**, and
the alignment is recorded as blocked pending a deliberate approach (regenerate inside a
Linux container, or hand-edit both lock entries together with a verification plan). The
repo is left consistent: `package.json` and lock both say 19.2.4, web builds.

**What actually shipped: the real duplicated logic.** `@brandcollabs/core` already exports
`formatCount(n)` — Indian digit grouping, used by the Expo directory screens for exactly
this number. The web app had it **missing from its re-export whitelist** in
`apps/web/lib/categories.ts` (the documented pattern the other 19 helpers use), so web
wrote `n.toLocaleString("en-IN")` inline in **12 places**. The same value — a business's
review count — was derived two different ways on the two surfaces.

Migrated **8 of the 10 call sites** to the shared `formatCount`, added it to the
re-export, and left the 2 that are genuinely not the same function: `inr = (n) =>
\`₹${…}\`` in `vendor-bookings.tsx` and `booking.tsx` prefix a currency symbol, which
`formatCount` does not do and `@brandcollabs/core`'s `formatPaise`/`formatRupees` are *unit
conversions* (`×100` / `÷100`), not display formatters.

Verified: web typechecks and **builds** (exit 0), root typecheck clean across 14
workspaces, lint unchanged at 0/707, both gates pass.

**The `packages/tokens` vs `globals.css` question — investigated, and the premise was wrong.**

This section and the summary table both described the two as "separate sources of truth"
that might need to converge. They are not. Investigating it properly showed:

- **They are already converged, and the convergence is automated.** `globals.css` *is* the
  single source of truth for colour, and `packages/tokens/scripts/extract.mjs` generates
  `src/palette.generated.ts` from it — its own header says so ("globals.css is the source
  of truth, not a copy of this output. Two hand-maintained palettes drift within a week").
  CI re-runs the generator and fails on any diff. I verified the file is currently **in
  sync**: regenerating it produces no change. So a literal colour cannot drift, and there
  was no defect here to fix. **Sixth correction to this document.**

- **Spacing and radii are not shared, and should not be.** Web has no `--space-*` or
  `--radius-*` custom properties at all; it uses Tailwind's default scale
  (`rounded-xl` ×103, `rounded-2xl` ×71, …). Native uses `space`/`radius` from
  `@brandcollabs/tokens` because React Native needs numbers. These cannot share one source
  without either teaching Tailwind a generated scale or generating numbers from Tailwind
  defaults — real churn to relabel two legitimate idioms. Left alone, recommended.

- **What *was* a genuine gap: the brand tint strengths.** `brandTokens()` derives the
  brand tints in TypeScript (`tintStrength = scheme === "dark" ? 0.15 : 0.07`) and is used
  by mobile only. Web derives the same three tints with CSS `color-mix` in `globals.css`
  (`in oklab, var(--brand-primary) 7%, …`), because it needs a custom property so `:hover`
  and the cascade can reach a brand colour. **The same six numbers are written twice, in
  two languages, and nothing checked that they agree** — the CI step above only guards the
  generated *palette*.

  They do agree today — every strength matches (light 7/13/18, dark 15/24/32) — and
  `scripts/check-brand-tokens.mjs` now asserts it, wired into CI and available as
  `npm run check:brand-tokens`. It is a *check*, not a generator, on purpose: the two
  sides are not the same computation (a browser resolves `color-mix`; StyleSheet has no
  cascade), so generating one from the other would mean teaching web to consume a TS
  constant or native to parse CSS. Comparing is the honest operation.

  I verified the guard can actually fail: changing the web's light tint to 9% makes it
  exit 1 and name both files. A guard that cannot fail would have been worse than none.

**React alignment — resolved.** This was the last open item, filed as "blocked" because a
clean lockfile recompute had dropped 69 platform-optional packages. That block was real
but surmountable: regenerating **inside a Linux container** (the platform the lockfile
must stay valid for) preserves them. Verified in a `node:22-bookworm` container with the
npm 11 the repo pins for lockfile work:

- every platform-optional package survived — `sharp-linux-x64`, `linux-arm64`,
  `darwin-arm64`, `darwin-x64`, `win32-x64`, `wasm32`, `@emnapi/*`;
- `npm ci --dry-run` → exit 0, and a **real `npm ci`** → exit 0;
- after install, **exactly one `react` in the whole tree**, web resolving 19.2.3 hoisted.

**But the full Linux regen also changed 21 React Native/metro packages** (0.87.1 → 0.86.3)
— the pre-existing mismatch the repo's own CI comment documents for
`@react-native/metro-config`. That is a toolchain change, not React alignment, and the
objective is explicit about preserving existing behaviour, so I applied only the React
part: the two stale `apps/web/node_modules/{react,react-dom}@19.2.4` entries removed and
`apps/web` moved to 19.2.3, with the 21 RN/metro versions left exactly as they were. The
surgical lockfile still passes `npm ci` under npm 11 in the container.

Result, verified on the host: one `react` install in the repo (the other four occurrences
are in `.claude/worktrees/`, which are gitignored), `apps/web` resolves the hoisted
19.2.3, and **`npm run build` for the web app passes**. Root typecheck clean across 14
workspaces, lint unchanged at 0/707, all gates pass, and mobile still bundles
(`tap-sprint`, `toolbox` at 10.4 MB).

*The 21 RN/metro version differences remain outstanding by choice — they are a genuine
finding (the lockfile and `react-native@0.86.3` disagree with each other) but they need
their own verification pass, not a ride-along on a React change.*

### Still outstanding from the audits

These were named in §3 but are **not** done, and should not be read as fixed:

- **The ready panel is shared; the rest of the game chrome is not.** `GameIntro` now
  covers the opening section for `tap-sprint` / `word-duel` / `block-clear`. Still three
  copies: the **HUD**, the **progress bar**, the **game-over card**, the **recent-rounds
  list** and the **Passport cross-sell**. These diverge for real reasons (clock vs move
  count; full-page vs board-overlay game-over), so merging them is a design decision
  rather than a diff — but they are still duplicated today.
- **The timers** — `lib/timer.ts` + `timer-core.ts` are still used by 4 wellness screens
  and **0 of 7** games. Six screens still tick-accumulate, which is the drift the engine
  was written to replace. `formatTime` is still byte-identical in `sudoku.tsx` and
  `crossword.tsx` while `timer-core.ts` has a tested `mmss()`.
- **Audio** — `merge-tiles` still runs its own private `setAudioModeAsync` and its own
  `hermes-merge-sound` AsyncStorage key rather than using `lib/sound.ts`.
- **Tests for the game layer.** `game-scores.ts` and `use-game-record.ts` have none. The
  crossword bug lived in exactly this gap, and typecheck/lint/bundle cannot catch a logic
  error in `saveRound`. Node 26 has no `mock.module`, and a loader-based AsyncStorage fake
  fought ESM/TS interop, so this needs a real plan (a jest/RTL setup, or injecting the
  storage layer) rather than a quick script.
- ~~**24 dead template files, 1,005 lines.**~~ — ✅ **deleted** (see §5 step 3, item 1).
  Verified unreferenced, then verified removable: 7 apps typecheck, root gate passes,
  lint unchanged, all 7 bundle at identical sizes. `expo-symbols` orphaned by the
  deletion was removed from quick-driver.
- **A theme contract.** The prerequisite for moving `ThemedText`/`ThemedView`/
  `IconSymbol`, which together have ~60 live callers across the standalone apps.

---

## 6. What NOT to share

- **Theme values.** Six genuinely different brand palettes. Share the *key vocabulary*
  (`background`, `surface`, `text`, `accent`, `danger`), not the colours.
- **`Button` / `Card` / `Input` across the standalone apps.** Three incompatible APIs;
  convergence is a redesign with a real regression risk (247-line dining Button vs
  116-line gatted Button are not the same component). Do it after step 2, if at all.
- **The `dining` screens.** 49% of all standalone lines and almost entirely bespoke.
  There is no duplication to reclaim.
- **The bespoke modals** (12 files / 3,966 lines in dining) and the four distinct
  headers. Similar roles, different products — merging them would cost more than it
  saves.
