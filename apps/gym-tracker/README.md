# Gym Tracker

A gym and body-weight tracker with openGym's look and flow, rebuilt natively in Expo SDK 57 + expo-router.
Local-first: everything is stored on the device with AsyncStorage, so there is no account and no backend.

```bash
npm run gym                              # from the repo root: Expo Go, port picked for you
npm test -w @hermes/gym-tracker          # training arithmetic (1RM, PRs, progression, streaks, heatmap)
npm run typecheck -w @hermes/gym-tracker
```

## Screens

- **Home** — week strip (green dot = trained, grey = planned), today's routine with Start, body-weight card
  (latest, change, goal and distance to it, trend chart with goal line, + Log), week-streak card → history.
- **Plan** — week schedule (each day → a routine or Rest) and the routines themselves; routine editor with
  icon, sets × reps, reorder, add from the library, start.
- **Start** (centre button) — starts today's routine, asks which routine on a rest day, turns orange as
  **Resume** while a workout is open.
- **Guided workout** — one exercise at a time: animated demo (tap to pause), target / equipment / best tags,
  last-time sets, progression hint ("Last time you hit all reps — try 87.5 kg"), weight and reps steppers,
  rest bar with +15s / Skip, progress bar, PR alert on finish, screen kept awake.
- **Stats** — workouts / this month / week streak / weight 30d tiles, 12-month activity heatmap by time
  trained, body weight with 1M / 3M / 1Y / All, per-exercise estimated-1RM curve, personal records.
- **Exercises** — 1,324 exercises with pictures, search, body-part and equipment chips, "+ Plan".

## Origin and licensing

The look and features follow [openGym](https://github.com/alexpcosta/opengym), but the code is written from
scratch: openGym is AGPL-3.0, and copying its code would put this app (and the fleet it ships with) under the
AGPL too. Nothing from openGym's source is used.

- **Exercise text** (`data/exercises.json`: names, muscles, equipment, English steps) comes from
  [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset), MIT License —
  see `data/EXERCISES-LICENSE.txt`.
- **Exercise pictures and animations are © Gym visual** and are *not* MIT. They are not bundled: `lib/media.ts`
  loads them from the dataset's CDN at a pinned commit (as openGym's mobile build does) and every screen that
  shows them shows the "© Gym visual" credit the dataset's terms require. **A store release needs our own
  licence from [gymvisual.com](https://gymvisual.com/)**, or a build with `EXPO_PUBLIC_EXERCISE_MEDIA=off`,
  which replaces every picture with a placeholder.

Regenerate the exercise data (pinned commit) with `npm run build:exercises -w @hermes/gym-tracker`.

## Before a store build

- Licence the Gym visual media, or build with `EXPO_PUBLIC_EXERCISE_MEDIA=off` (see above).
- Pick a final name — "Gym Tracker" is a working title (also in `apps/mobile/targets.mjs` and the developer catalog).
- Create the EAS project (`npx eas-cli init` here) and set `EAS_PROJECT_ID["gym-tracker"]` in `apps/mobile/targets.mjs`.
- `expo install --check` reports patch updates for expo-router / expo-constants / expo-linking; the root
  `overrides` pin expo-router to 57.0.24 for the whole fleet, so bump them fleet-wide, not here alone.

## Not built yet (openGym has them)

Supersets, timed exercises, per-routine progression rules (Greyskull etc.), RPE/RIR, cardio logging, muscle
body map, plan sharing, custom exercises, CSV import (FitNotes/Strong/Hevy), backup export, reminders,
12 languages, accent colours, AI coach.
