import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Business } from "./api";

const KEY = "hermes-saved";

/**
 * Saved listings, stored on the device.
 *
 * The whole row is persisted, not just the id: the point of saving a plumber is
 * to be able to call them, and requiring a network round-trip to see the number
 * you deliberately kept would defeat the feature exactly when it matters — poor
 * signal, standing in front of a broken pipe.
 */
type SavedContext = {
  items: Business[];
  has: (id: number) => boolean;
  toggle: (b: Business) => void;
  ready: boolean;
};

const Ctx = createContext<SavedContext | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Business[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setItems(JSON.parse(raw) as Business[]);
      })
      .catch(() => {
        /* corrupt or absent — start empty rather than crash on launch */
      })
      .finally(() => setReady(true));
  }, []);

  function persist(next: Business[]) {
    setItems(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }

  const value = useMemo<SavedContext>(
    () => ({
      items,
      ready,
      has: (id) => items.some((b) => b.id === id),
      toggle: (b) => {
        const exists = items.some((x) => x.id === b.id);
        // Newest first: the thing you just saved is the thing you want to see.
        persist(exists ? items.filter((x) => x.id !== b.id) : [b, ...items]);
      },
    }),
    [items, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSaved(): SavedContext {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSaved must be used inside <SavedProvider>");
  return v;
}
