/**
 * The session id — "that particular time and audience", as one join key.
 *
 * Every ad event carries it, so a later question like "did the rewarded unlock
 * work better on the second session than the first" is answerable from our own
 * rows instead of guessed. It is a random id held in AsyncStorage, never a device
 * id and never a phone number: it identifies a run of the app, not a person, and
 * losing it costs us nothing but a lost join.
 *
 * Deliberately NOT `expo-application`'s install id or any hardware identifier.
 * Those are precisely what the ad SDKs collect and what privacy labels disclose;
 * this app does not need another one.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "ads.session.v1";

/** A random hex id. `crypto.randomUUID` is not guaranteed on Hermes, so build one. */
function randomId(): string {
  let out = "";
  for (let i = 0; i < 32; i += 1) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

let cached: string | null = null;

/**
 * The id for this run of the app. Stable for the process, new on each cold start.
 *
 * Returns a random id even if storage fails: telemetry must never be the reason a
 * screen does not render, and an unjoinable id is strictly better than a throw.
 */
export function sessionId(): string {
  if (!cached) cached = randomId();
  return cached;
}

/**
 * Give this run its own id and remember it for the process. Called once at boot;
 * a fresh cold start is what makes it a new session.
 */
export async function startSession(): Promise<string> {
  cached = randomId();
  await AsyncStorage.setItem(KEY, cached).catch(() => {});
  return cached;
}
