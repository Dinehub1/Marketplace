"use client";

import { useEffect, useRef } from "react";

type Props = {
  businessId: number;
  brandSlug: string;
  city?: string | null;
};

// Clicks on any element carrying this attribute are recorded as the given
// event type (the anchor is found via closest(), so clicks on the icons inside
// the link still resolve to the link itself).
const TRACK_ATTR = "data-track";

/** Fire-and-forget event POST. `keepalive` lets the request survive the page
 *  navigating away (tel:/wa.me/maps clicks), and a failure is silently ignored
 *  because analytics must never block a conversion. */
function post(payload: Record<string, unknown>) {
  try {
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

function getSessionId(): string | null {
  try {
    let sid = window.sessionStorage.getItem("hermes_sid");
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.sessionStorage.setItem("hermes_sid", sid);
    }
    return sid;
  } catch {
    return null;
  }
}

/**
 * Invisible measurement layer for a business detail page.
 *
 * - Records a `view` once per mount (the ref guard absorbs the double-mount of
 *   React StrictMode in dev; a real user navigation is a new mount and counts).
 * - Delegates a single document-level click listener and records call /
 *   WhatsApp / directions / website taps from the anchors that carry
 *   `data-track`.
 *
 * `session_id` is shared across events so a later rollup can compute pageviews
 * (COUNT *) vs distinct visitors (COUNT DISTINCT session_id) per business.
 */
export function BusinessEventTracker({ businessId, brandSlug, city }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const sid = getSessionId();
    const base = {
      business_id: businessId,
      brand_slug: brandSlug,
      session_id: sid ?? undefined,
      city: city ?? undefined,
    };

    post({
      ...base,
      type: "view",
      referrer: document.referrer || undefined,
    });

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(`[${TRACK_ATTR}]`) as HTMLElement | null;
      const type = el?.getAttribute(TRACK_ATTR);
      if (!type) return;
      post({ ...base, type });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [businessId, brandSlug, city]);

  return null;
}
