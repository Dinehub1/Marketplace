import raw from '@/data/exercises.json';

/** One exercise from the library (see data/EXERCISES-LICENSE.txt). `media` is a CDN key, see lib/media.ts. */
export type Exercise = {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondary: string[];
  steps: string[];
  media: string | null;
};

export const EXERCISES = raw as Exercise[];
const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export const exerciseById = (id: string): Exercise | undefined => BY_ID.get(id);
export const exerciseName = (id: string) => titleCase(BY_ID.get(id)?.name ?? 'Unknown exercise');

export const BODY_PARTS = [...new Set(EXERCISES.map((e) => e.bodyPart))].sort();

/** Equipment, most common first, so the chips people actually need come before "tire" and "hammer". */
export const EQUIPMENT = (() => {
  const count = new Map<string, number>();
  for (const e of EXERCISES) count.set(e.equipment, (count.get(e.equipment) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
})();

/** Case-insensitive match on every word, against name, target muscle and equipment. */
export function searchExercises(query: string, bodyPart: string | null, equipment: string | null = null): Exercise[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return EXERCISES.filter((e) => {
    if (bodyPart && e.bodyPart !== bodyPart) return false;
    if (equipment && e.equipment !== equipment) return false;
    if (!words.length) return true;
    const hay = `${e.name} ${e.target} ${e.equipment}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export const titleCase = (s: string) => s.replace(/(^|[\s(/-])(\w)/g, (_, a: string, c: string) => a + c.toUpperCase());
