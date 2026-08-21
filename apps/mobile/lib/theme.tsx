import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  paletteFor,
  brandTokens,
  elevation,
  type Palette,
  type Scheme,
} from "@hermes/tokens";
import { BRAND } from "./config";

export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "hermes-theme";

export type Theme = {
  scheme: Scheme;
  choice: ThemeChoice;
  setChoice: (c: ThemeChoice) => void;
  c: Palette;
  brand: ReturnType<typeof brandTokens>;
  elevation: (level: 0 | 1 | 2 | 3) => ReturnType<typeof elevation>;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Three states, not two. A binary toggle silently opts the user out of their
  // OS setting the first time they touch it and gives them no way back.
  const system = useColorScheme();
  const [choice, setChoiceState] = useState<ThemeChoice>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === "light" || v === "dark") setChoiceState(v);
      })
      .catch(() => {
        /* first launch, or storage unavailable — "system" is the right default */
      });
  }, []);

  function setChoice(next: ThemeChoice) {
    setChoiceState(next);
    if (next === "system") AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    else AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }

  const scheme: Scheme = choice === "system" ? (system === "dark" ? "dark" : "light") : choice;

  const value = useMemo<Theme>(
    () => ({
      scheme,
      choice,
      setChoice,
      c: paletteFor(scheme),
      brand: brandTokens(BRAND.theme, scheme),
      elevation: (level) => elevation(level, scheme),
    }),
    [scheme, choice],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) throw new Error("useTheme must be used inside <ThemeProvider>");
  return t;
}
