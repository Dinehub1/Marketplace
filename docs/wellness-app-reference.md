# What the reference apps actually do — an audit, and what we take from it

Researched 2026-09-16 for the wellness family (Breathe, Stretch, Walk, Water, Japa, Sleep).
Sources are the apps' own App Store listings plus independent 2026 round-ups; the pattern
across them is more useful than any single app.

## The breathing apps

- **Breathwrk** (now part of Peloton) — 100s of exercises, daily classes, 10+ techniques,
  custom patterns, **haptic guidance**, streaks & levels, lung score and exhale tests,
  Apple Health, offline. Price anchors: $59.99/yr, and the listing shows Pro tiers at
  $38.99–$69.99 and a $9 monthly.
- **Calm / Headspace** — $69.99/yr each. Breathing is *one feature among many*: meditation,
  sleep stories, courses. Their tab bars are content libraries, not tools.
- **Paced Breathing** — the narrow case done well: customisable parameters, progress
  tracking with streaks and goals, background playback. $13.49/month.
- **Apple Mindfulness** — free, basic, on the wrist: the floor, not the ceiling.
- **Vayu** — the 2026 differentiator set: 10+ techniques, custom patterns, **haptic
  guidance without looking at the screen**, Apple Watch *and* Wear OS, **post-session HRV**.

What every one of them leads with: **an expanding/contracting circle**. It is the single
most important visual in the category, and it is what we already had.

## The tracker apps

- **Streaks** (iOS) — one-time purchase, no free tier. Up to 24 habits, visual streak
  indicators, Apple Health, Shortcuts, watch complications, iCloud sync.
- **Habitify** — $8.99/mo or $49.99/yr. Streaks, completion history, progress calendar,
  reminders by time of day, mood notes, built-in timer, Apple Health + Google Fit.
- **HabitBox** — free + optional Plus. One-tap check-in, no account, **data stays on the
  phone**, calendar heatmap, streaks and stats from day one.
- **Way of Life** — colour-coded logging, **visual trend charts**, streak tracking, notes.
- **Habit Tracker** — auto-tracking of water/steps/exercise, **weekly/monthly/yearly
  reports**, a yearly view that puts every day together, reminders.

The consensus feature set, in order of how often it appears: **streak → weekly chart →
calendar heatmap → reminders → History → Apple Health → widgets/watch**.

## What we had, and what we just added

| Capability | Before today | Now |
|---|---|---|
| Big single action (the circle / the timer) | ✅ | ✅ |
| Session remembered on the device | ✅ (last session only) | ✅ full history |
| Streak (current + best) | ❌ | ✅ |
| Progress ring against a goal | ❌ | ✅ |
| Last 7 days as bars | ❌ | ✅ |
| Last 30 days as a heat strip | ❌ | ✅ |
| Week-over-week comparison | ❌ | ✅ |
| Recent sessions list | ❌ | ✅ |
| Works offline, no account | ✅ | ✅ |
| Counters that survive a date change | ✅ | ✅ with history |
| Reminders / notifications | ❌ | ❌ — needs a native build |
| Apple Health / Google Fit | ❌ | ❌ — native only |
| Widget / Live Activity / Watch | ❌ | ❌ — native only |
| Onboarding + paywall | ❌ | ❌ — needs the payments decision |

Deliberately **not** copied: the content-library tab bar. Calm and Headspace are big because
they sell meditation *content*; we have no content, and an empty library is what makes an app
look unfinished. Our tab bar holds five working tools instead.

## What each app should be, as its own listing

He wants separate apps, not tabs in one app. Each identity below is a different product with
its own first screen, its own accent, its own analytics and its own reason to be installed —
which is also what keeps Apple's 4.3 duplicate-app rule survivable (see
`docs/store-listings-and-risk.md`):

1. **Breathe — Slow Breathing.** First screen: the circle. Analytics: cycles, minutes, streak,
   pattern mix. Free patterns: coherent + box. Paid: 4-7-8, long exhale, custom patterns,
   phrase accompaniment.
2. **Stretch — Desk Mobility.** First screen: the routine, one move at a time. Analytics:
   routine completions, streak, minutes. Paid: the second and third routines.
3. **Walk — Interval Timer.** First screen: the interval wheel (FAST / EASY, big enough to
   read at arm's length while walking). Analytics: intervals, fast minutes, streak.
4. **Water — Daily Counter.** First screen: glasses today against a target *the user sets*.
   Analytics: week bars, month heat strip, streak.
5. **Japa — Mala Counter.** First screen: the bead. Analytics: beads, rounds, streak.
   Optional phrase; purely local.
6. **Sleep — Wind Down.** First screen: 4·7·8 rounds, then lights-out. Analytics: nights,
   rounds, streak.

Each one must ship with: no account, no data leaving the phone, a stated scope ("this is a
timer, not a treatment"), and — for store review — a visible difference in purpose from its
siblings, not just a different colour.
