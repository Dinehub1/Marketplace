# Sound in the wellness apps

Six screens — Breathe, Stretch, Walk, Water, Japa, Sleep — make a sound. Nothing is downloaded,
nothing is recorded, and nothing leaves the phone. This file is the record of what the sounds are,
where they come from, and the limits of the approach, because "we generated it" is only a comfort if
you can read what that means.

**There was a spoken voice and there is not one any more.** It said "breathe in" and "breathe out",
synthesized by a formant model in this repository, and on a real phone it sounded robotic and unclear.
It was removed rather than defended. The section below records what it was, what replaced it, and why
the obvious alternative — the phone's own text-to-speech — is still rejected.

## The one rule

**Audio is feedback, never a rule.** No session depends on a sound. A phone on silent, a device that
refuses the audio session, an asset that failed to bundle — every one of those paths ends with the
screen working exactly as it did before, silently. No control awaits a sound, no sound can throw into
a render, and the timer's arithmetic never consults the audio layer.

That is why `lib/sound.ts` swallows every failure it can: there is nothing a screen could usefully do
about a device with no audio route, and the alternative is a breathing app that crashes in a quiet
room.

## Where the sounds come from

They are **generated from arithmetic** by a script in this repository:

```
node scripts/make-wellness-sounds.mjs
```

which writes 16 files to `apps/mobile/assets/wellness/` — fifteen cues and one ambient bed — about
2.3 MB in total, of which 1.3 MB is the bed. The two helpers it uses are:

- `scripts/lib/wav.mjs` — the WAV container and the DSP primitives (sine/triangle tones, a biquad
  resonator, filtered noise, envelopes, a soft limiter, a seam-safe loop cross-fade).
- `scripts/lib/voice.mjs` — the retired **source–filter formant synthesizer**, kept unimported. A
  glottal pulse train shaped by three resonant filters, a word as a glide between two vowels. It
  works, it is the reason the voice existed, and it is the file to fix if a voice is ever wanted
  again.

### Why not sample packs, and why not `expo-speech`

Three reasons, in the order they cost when ignored:

1. **Licence.** A wellness app that ships a chime from an unknown source has a claim on it nobody can
   answer. Everything here is ours outright and the recipe is in the two files above.
2. **Offline.** This is the one product in the fleet that cannot fail on a network. The platform
   text-to-speech engine on Android may fall back to a *network* voice, which would break that
   promise and would also mean the words a person typed leave the phone. A formant synthesizer in the
   bundle cannot do either.
3. **Size.** The whole set is smaller than one stock "meditation bell" MP3, and it needs no
   attribution line in the store listing.

### The palette

A wellness palette, deliberately not the chiptune one the game uses: sine and triangle bodies, 20–60 ms
attacks, long releases, and a band of filtered noise on anything that represents breath. One rule
shapes every cue — **nothing rises at a hold and nothing falls at a start**. Rising reads as "draw in",
falling as "let go", which is the direction the circle already animates in. A cue that contradicted
the animation would be worse than no cue.

| Cue | Where | What it is |
|---|---|---|
| `cue-in` | Breathe, Sleep | G3→C4 (196→262 Hz), a rising open fifth, with a breath of noise sweeping open |
| `cue-out` | Breathe, Sleep | The exact mirror, C4→G3, noise closing |
| `cue-hold` | Breathe, Sleep | Flat C4, quiet — the one cue with no direction in it |
| `cue-done` | Breathe, Sleep, Walk, Stretch | Three notes up a major triad, slowly |
| `cue-tick` | Stretch, Walk, Water | A short low note: "the world moved", with nothing to say |
| `cue-relax` | Stretch | The tick taken down a fourth and stretched: the class is ending, not changing |
| `cue-interval` | Walk, Stretch | Two notes — a pace change, or a movement that is done once per side |
| `cue-fast` | Walk | Two short high notes, pushing upward |
| `cue-easy` | Walk | The mirror: lower, slower, settling |
| `cue-last` | Walk | The last fast interval — a rising major third |
| `cue-drop` | Water | A plucked drop landing in water |
| `cue-bead` | Japa | A wooden click. The shortest sound in the set, because it plays up to 108 times |
| `cue-round` | Japa | The bead struck twice over a low fifth |
| `cue-swell` | Sleep | A 700 ms attack and no transient at all — you should not be able to tell when it began |
| `drone` | Breathe, Sleep | A 16-second seamless bed: A1 and its fifth, slow swells, a very quiet room floor |


The `drone` is **loopable by construction**: the head is cross-faded into the tail by `loopable()`
before it is written, so it can run under a ten-minute session with no seam. That is the reason it is a
generated file rather than a player-level loop — the seam is a real defect and this is where it is
fixed.

## The voice that was removed, and what replaced it

The first version of this shipped fifteen spoken phrases from `scripts/lib/voice.mjs`: `breathe in`,
`breathe out`, `hold`, `relax`, `left`, `right`, `switch sides`, `fast`, `slow`, `last round`,
`round done`, `ten more`, plus a hum and an open vowel. The model was real — a glottal source through
three formant resonators, with each word a glide between two vowel targets, which is the same shape as
the Klatt synthesizer — and the verdict on a real phone was that it sounded like a 1980s talking
machine. **A person doing a breathing exercise should not be listening to one, so it is gone.**

What replaced it is not silence. In the three places the voice carried something a tone could not:

| The voice said | Now |
|---|---|
| `walk fast` / `walk slow` | `cue-fast` (rising, pushing) and `cue-easy` (falling, settling) — the alternation is audible as an alternation |
| `last round` | `cue-last` — a rising major third, so "nearly done" without a word |
| `round done` (Japa) | `cue-round` — the bead struck twice over a low fifth, which is how a real mala tells you |
| `relax` (Stretch wind-down) | `cue-relax` — the tick taken down a fourth and stretched |

Everywhere else the tone was always the real cue: a rising figure *is* an inward breath, which is why
the words were riding on top of it rather than the other way round.

**What is genuinely lost.** Two things the voice did that a tone cannot. It named the *side* in
Stretch's bilateral movements — there is nothing in pitch that means "left", so that information
stays on screen in the side pill, where somebody following the class with their eyes open has always
read it. And it could have pronounced a person's own words, which it never could anyway (it spoke a
fixed list).

**Why not the platform's text-to-speech.** That was rejected before the voice was built and is still
rejected: on Android it can be a *network* voice, which would break this app's one promise, and it
would send whatever a person typed to a third party. A robotic offline voice is a bad feature; a clear
online one is a worse product.

## The switches

Two, both defaulting to on except the bed:

## The three switches, and the master mute

`lib/settings.ts` holds three preferences, all defaulting to on except the bed:

| Switch | Layer | Default |
|---|---|---|
| `cuesOn` | Information — the tones | on |
| `droneOn` | Atmosphere — the ambient bed | **off** |

Two switches because they are two different promises: somebody may want the tones but not a drone
heard through headphones next to a sleeping partner. One switch for both would mean turning off the
thing you want because of the thing you do not. A third — `voiceOn` — is gone with the voice; the key
is dropped rather than left as a dead `false`.

The speaker icon in each screen's header is a **master mute**: it turns both off together, and back on
together. The first version of that control flipped `cuesOn` alone, while the screens that spoke went
on speaking — a mute button that does not mute is worse than no button, because the person believes it
worked and stops looking for the real one. The lesson outlived the voice. Details in `setMuted` in
`lib/sound.ts`.

## What this does not do

- **It does not play in the background.** The bed pauses when the app is suspended. Keeping audio
  alive with the screen off needs a background audio mode and a longer conversation with both stores;
  it is named here and on the Sleep screen rather than quietly promised.
- **It does not take over the audio session.** `mixWithOthers` means somebody's music keeps playing
  underneath. `playsInSilentMode: false` means the ringer switch is obeyed, which is the control
  people actually use to silence an app.
- **It does not speak over itself.** The engine reports a phase only when the phase *changes*, so a
  cue fires once per turn and a background catch-up that skips four phases plays one sound instead of
  four. That is why the sounds are wired into `onPhase` rather than into an effect on the countdown —
  and `onPhase` is called from `sync`, not from inside a React state updater, because a side effect in
  a render-phase callback is a crash waiting for the first sound to be played from one.

## Regenerating, verifying, and looking

```
node scripts/make-wellness-sounds.mjs      # regenerate the 16 audio files
node scripts/make-app-icons.mjs            # regenerate the 20 icon sets
node scripts/preview-app-icons.mjs         # one contact sheet, to be looked at
npm run check:timer                        # the wellness timer engine's arithmetic
```

`make-wellness-sounds.mjs` refuses to write a file that is silent, that clips, that is too short to
hear, that is long enough to talk over the next phase, or that is a long cue with almost no energy —
every one of those is a failure a size check cannot see. It is also deterministic: the noise sources
are seeded, so two runs produce byte-identical files.

Verification of the *app* side is types and lint (`npx tsc --noEmit`, `npx eslint`), plus the
screenshot pipeline for rendering. Audibility on a real device is the one thing none of those can
check, and it is worth one listen on a phone before a store build.
