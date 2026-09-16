/**
 * The settings a person actually changes, in one place — and deliberately not in the
 * database.
 *
 * Why a store rather than props: the goal on the Profile page is the SAME number the ring on
 * Progress draws and the Water screen counts against. Three copies in three screens is how an
 * app ends up telling a person their goal is 8 in one place and 6 in another. It was also a
 * real bug: each screen used to hold its own copy, so changing the goal on Profile did not
 * move the ring until the app restarted.
 *
 * Why AsyncStorage and not Supabase: a goal, a weekly target and a two-line phrase are
 * preferences, not a record of practice. They are cheap to re-enter, they mean nothing
 * without the sessions they describe, and keeping them here is what lets the Profile page
 * honestly say that the only thing leaving the phone is what you actually did.
 */
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "dropby-wellness-settings";

export type Settings = {
  /** Glasses a day on Water, and the ring on Progress. */
  waterGoal: number;
  /** Sessions a week for the timer practices. */
  weeklyGoal: number;
  /** The phrase a person breathes or counts with. Empty means none. */
  phrase: string;
};

export const DEFAULT_SETTINGS: Settings = { waterGoal: 8, weeklyGoal: 5, phrase: "" };

let settings: Settings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Settings {
  return settings;
}

let hydrated = false;

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    settings = { ...DEFAULT_SETTINGS, ...parsed };
    emit();
  } catch {
    // A corrupt value falls back to the defaults rather than taking the app down.
  }
}

/** Writes the patch through to the device and to every screen at once. */
export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  settings = { ...settings, ...patch };
  emit();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Kept in memory for this run; the next change tries again.
  }
}

/** Clears the settings back to their defaults, for "Delete my data" on the Profile page. */
export async function resetSettings(): Promise<void> {
  settings = DEFAULT_SETTINGS;
  emit();
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* nothing to do: the in-memory copy is already back to defaults */
  }
}

export function useSettings() {
  // The server snapshot is the current value, so the Expo web build renders the same thing
  // the client does instead of flashing the defaults.
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    void hydrate();
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    void updateSettings(patch);
  }, []);

  return useMemo(() => ({ settings: value, update }), [value, update]);
}
