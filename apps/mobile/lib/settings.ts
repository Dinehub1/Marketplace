/**
 * The settings a person actually changes, in one place.
 *
 * Why a store rather than props: the goal on the Profile page is the SAME number the ring
 * on Progress draws and the Water screen counts against. Three copies in three screens is
 * how an app ends up telling a person their goal is 8 in one place and 6 in another.
 */
import { useCallback, useEffect, useState } from "react";
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

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) });
      })
      .catch(() => {});
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    setSettings((cur) => {
      const next = { ...cur, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { settings, update };
}
