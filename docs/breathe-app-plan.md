# Breathe — a slow-breathing app, planned for Expo

A guided breathing screen: a circle that grows as you breathe in and settles as you
breathe out, a phrase you choose, and sessions you can measure. It ships inside the
Expoolbox app first, and promotes to its own store listing with one line in
`apps/mobile/targets.mjs` when you want it.

## Why this one is worth building

- **₹0 to run.** No engine, no model, no server round-trip: it is a timer and an
  animation. Every session works in aeroplane mode. Compare with the passport photo,
  which needs a segmentation model — this one cannot cost us anything or fail on a
  slow network.
- **It fits the phone better than the web.** Haptics and a full-screen circle are
  things a phone does and a browser does not.
- **It is a retention product, not a one-off.** A tool is used once and forgotten; a
  breathing app is opened daily, which is what makes a store listing get ranked.

## The four patterns (this is the whole content model)

| Pattern | Timing | Note shown on screen |
|---|---|---|
| Coherent | 5.5 in · 5.5 out | About six breaths a minute — the rate most used in slow-breathing research |
| Box | 4 · 4 · 4 · 4 | Even in, hold, out, hold; steadying, used by swimmers and soldiers |
| 4·7·8 | 4 · 7 · 8 | A long exhale, the classic before-sleep pattern |
| Long exhale | 4 in · 8 out | The shape most traditions use with a repeated phrase |

## The prayer angle, done honestly

Many traditions pair a **long, slow breath with a repeated phrase** — japa, dhikr, the
rosary, pranayama counting. What they share, mechanically, is a slow breath and a
repetition. So the app does not pick a religion and does not invent one: you type your
own two lines (one for the in-breath, one for the out-breath), and the screen shows the
half you are on. Default is "Breathe in / Breathe out"; someone can type "So / Hum" or
their own words.

**The claims we do NOT make.** No "lowers blood pressure", no "heals anxiety", no
invented statistics, no testimonials. What the screen says instead:
- slow breathing at roughly six breaths a minute is the rate slow-breathing research
  focuses on, and extended exhales are what those protocols share;
- it is **not** a treatment, a diagnosis, or a replacement for care;
- don't practise breath-holds in water or while driving, and stop if you feel dizzy.

That honesty is also the marketing position: a breathing app that promises nothing
medically is one that cannot be reported and can be listed on both stores.

## The screen

1. **Session** — pattern chips, a length chip (3 / 5 / 10 minutes), Start.
2. **The circle** — grows over the inhale, holds, settles over the exhale, with the
   phase word ("Breathe in" / "Hold" / "Breathe out") and the seconds left in the phase.
3. **Counting** — cycles completed, minutes done, and the rate the pattern means
   (60 ÷ cycle seconds), so the number on screen is arithmetic, not a claim.
4. **End card** — minutes, cycles, pattern, and the last session kept on the device so
   the app has a memory without an account.
5. **Below the fold** — what slow breathing does, why long prayer is in here, and what
   this is not (the three short sections above, verbatim).

## Cost, price, and what it needs from the platform

- Free, no AI, no payment. A ₹0 product that exists to bring people back.
- Needs: nothing from the user. No keys, no vendor.
- Where it plugs in: `apps/mobile/app/breathe.tsx`, registered in the screenshot
  pipeline so it appears in the gallery and on the test page, and listed in the queue
  for the hourly job to wrap in the shared frame once the frame exists.

## Open questions for Jaydeep

1. Own store listing, or a screen inside the toolbar app? (Own listing is one line, but
   it also adds a 13th app to submit under the 4.3 duplicate-app risk.)
2. Default phrase for India: "So / Hum", a Sanskrit counting pair, or leave it blank?
3. ~~Sound: a soft tone at each phase change, or silent with haptics only?~~ **Answered, and
   built.** There is a rising tone on the inhale, a falling one on the exhale, a flat one on a
   hold, and a three-note chime at the end — plus a synthesized voice saying "breathe in" and
   "breathe out", and an optional ambient bed. All of it is generated inside this repository
   rather than downloaded or recorded, so it works in aeroplane mode, needs no permission and
   carries no licence. Three separate switches (cues, voice, backdrop) because they are three
   different things to want. The one limit, which the Profile page states: the voice is a
   formant synthesizer, so it speaks a fixed set of phrases and **cannot read the words you
   type** — the screen shows "So / Hum", the voice still says "breathe in". The whole design,
   the cue table and the reasoning are in `docs/wellness-sound.md`.

## What the screen does now (sound, voice, motion)

Built on top of the plan below, in the same spirit — nothing claims anything it cannot do.

- **Cues** — a rising open fifth (G3→C4) on the inhale with a breath of filtered noise under it,
  the exact mirror falling on the exhale, a flat quiet note on a hold, and three notes up a major
  triad when the session ends. The rule that shapes them: nothing rises at a hold and nothing
  falls at a start, because that is the direction the circle already animates in.
- **Voice** — a source–filter formant synthesizer (a glottal pulse shaped by three resonant
  filters, with a word as a glide between two vowels). It is not a recording and not the
  platform's text-to-speech: no permission, no network, and the recipe is readable in
  `scripts/lib/voice.mjs`.
- **Motion** — three layers, each with one job: idle ripples that say the screen is alive, the
  pacer disc driven from the engine's own timestamps, and a hairline arc that fills over the
  current breath so "how much of this breath is left" is readable without reading. All three
  respect the OS Reduce Motion setting.
- **Sound control in the header** — a master mute that silences every layer, because a speaker
  icon that leaves the voice talking is worse than no control at all.

