/**
 * Turning a thrown value into a sentence.
 *
 * `catch (e: any)` was used in a dozen places to reach `e.message`. Since TypeScript
 * 4.4 a `catch` binding is `unknown`, which is the honest type — anything can be
 * thrown, including a string. This is the one place that narrows it, so every caller
 * stops repeating `e?.message ?? "…"` and stops being able to pretend `e` is an Error.
 */

/** The message from a thrown value, or `fallback` when there is not one. */
export function errorMessage(e: unknown, fallback = ""): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "string" && e) return e;
  return fallback;
}
