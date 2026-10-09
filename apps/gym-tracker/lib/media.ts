/**
 * Exercise pictures and animations.
 *
 * They are © Gym visual (https://gymvisual.com/), redistributed by hasaneyldrm/exercises-dataset
 * under Gym visual's own terms, not under the dataset's MIT License. Nothing is bundled: they are
 * loaded from the dataset's CDN at a pinned commit, the same way openGym's mobile build loads them,
 * and every screen that shows one shows MEDIA_CREDIT with it, as the dataset's terms require.
 *
 * Before a store release, either get a licence from Gym visual or set
 * EXPO_PUBLIC_EXERCISE_MEDIA=off, which turns every picture into the muscle placeholder.
 */
const COMMIT = '7455efae41b330c265e7cd4b78dfa848e7ce5ebd';
const BASE = `https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@${COMMIT}`;

export const MEDIA_ENABLED = process.env.EXPO_PUBLIC_EXERCISE_MEDIA !== 'off';
export const MEDIA_CREDIT = '© Gym visual';

/** The still 180×180 picture. */
export const imageUrl = (key: string | null | undefined) =>
  MEDIA_ENABLED && key ? `${BASE}/images/${key}.jpg` : null;

/** The looping animation. */
export const animationUrl = (key: string | null | undefined) =>
  MEDIA_ENABLED && key ? `${BASE}/videos/${key}.gif` : null;
