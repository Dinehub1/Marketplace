"use client";

import { useEffect, useState } from "react";

export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "hermes-theme";

/**
 * Runs before first paint, inlined in <head>, so the stored choice is applied
 * to <html> while the document is still parsing. Without this the page renders
 * one light frame and then snaps to dark — a full-screen brightness jump, which
 * is exactly the thing reduced-motion guidance asks you not to do.
 *
 * It writes nothing when the choice is "system": the absence of the attribute
 * is what lets the `prefers-color-scheme` media query take over.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var c=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)});if(c==="dark"||c==="light"){document.documentElement.setAttribute("data-theme",c)}}catch(e){}})()`;

function apply(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
  try {
    if (choice === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* private mode — the choice just won't persist */
  }
}

const OPTIONS: { value: ThemeChoice; label: string; d: string }[] = [
  {
    value: "light",
    label: "Light",
    d: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/>',
  },
  {
    value: "system",
    label: "System",
    d: '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8.5 20.5h7"/>',
  },
  {
    value: "dark",
    label: "Dark",
    d: '<path d="M20 13.5A8.2 8.2 0 0 1 10.5 4a8.5 8.5 0 1 0 9.5 9.5z"/>',
  },
];

/**
 * Three states, not two. A binary toggle silently opts the user out of their
 * OS preference the first time they touch it, and gives them no way back —
 * "system" has to be reachable, and it is the default.
 */
export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light") setChoice(stored);
    } catch {
      /* ignore */
    }
  }, []);

  function pick(next: ThemeChoice) {
    setChoice(next);
    apply(next);
  }

  return (
    <div
      className="segmented"
      role="radiogroup"
      aria-label="Colour theme"
      /* Rendered but inert until mounted: the server cannot know the stored
         choice, so marking the wrong option selected would be a lie that
         screen readers announce. Hiding it entirely would shift the header
         layout on hydration, which is worse. */
      aria-busy={!mounted}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={mounted && choice === o.value}
          aria-selected={mounted && choice === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => pick(o.value)}
          className="grid place-items-center"
          style={{ width: "2rem", height: "1.75rem", padding: 0 }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: o.d }}
          />
        </button>
      ))}
    </div>
  );
}
