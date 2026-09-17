import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * The OS "Reduce Motion" setting, as one reactive boolean.
 *
 * The app had no handling for this at all: every press spring, every push transition and
 * the breathing circle ran at full amplitude whatever the phone was set to. That is a
 * defect rather than a missing preference, for two reasons. The breathing pacer is a slow
 * full-screen oscillation — the exact pattern the setting exists for — and a vestibular
 * disorder makes a screen sliding sideways genuinely unpleasant rather than merely busy.
 *
 * **One subscription for the whole app, not one per component.** `Press` renders on
 * almost every screen, so a listener per instance would be dozens of registrations of the
 * same thing. Module state behind `useSyncExternalStore` keeps a single
 * `AccessibilityInfo` subscription and still gives every consumer the same value on the
 * same commit.
 *
 * What actually *changes* is deliberately not decided here, because it differs by call
 * site: a press cross-fades instead of scaling, a pushed screen fades instead of sliding,
 * and the breathing pacer keeps its rhythm while dropping its scale. Each of those three
 * reads this hook and says so in its own words.
 */

let reduceMotion = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

let started = false;
function start() {
  if (started) return;
  started = true;
  // The whole block is guarded on purpose. This hook is called from `Press`, which is on
  // every screen of every one of the twenty apps, so a platform with a partial
  // accessibility API must degrade to "motion on" — never take a press handler down with
  // it. `motion on` is also the honest default: it is what the app did before this
  // existed, and it is what someone who has not asked for reduced motion expects.
  try {
    // The listener is the real source, not the initial read: the setting can change
    // while the app is running (Settings, or a Control Centre toggle), and a value read
    // once at launch would go stale without the user ever seeing it take effect.
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => {
        if (on !== reduceMotion) {
          reduceMotion = on;
          emit();
        }
      })
      .catch(() => {
        /* The read failed; the listener below may still answer later. */
      });
    AccessibilityInfo.addEventListener("reduceMotionChanged", (on) => {
      if (on !== reduceMotion) {
        reduceMotion = on;
        emit();
      }
    });
  } catch {
    /* No accessibility API here. Motion stays on. */
  }
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => reduceMotion;

/**
 * For a static render, where there is no OS setting to read. Motion is the default and
 * the client corrects it on the first commit — a frame of motion at launch is a smaller
 * cost than rendering every screen in its reduced form for people who did not ask.
 */
const getServerSnapshot = () => false;

/** True when the OS asks for reduced motion. Safe to call from anywhere in the app. */
export function useReduceMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
