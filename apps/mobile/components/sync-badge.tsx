/**
 * The one line that answers "is my data safe?" on a wellness screen.
 *
 * Why it exists: the wellness apps now write to a database as well as the phone, and a person
 * who cannot tell whether that happened has to guess. Every state this can show is one the
 * store can actually be in, and none of them claim more than is true — "Backed up" only when
 * the server confirmed, "Saved on this phone" when it did not, and a count of anything still
 * waiting rather than a green tick over a silent backlog.
 */
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui";
import type { SyncState } from "@/lib/session";

export function SyncBadge({
  sync,
  pending = 0,
  lastSyncedAt = null,
  style,
}: {
  sync: SyncState;
  /** Writes accepted on the phone but not yet in the database. */
  pending?: number;
  lastSyncedAt?: number | null;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const { label, tone, busy } = describe(sync, pending, lastSyncedAt);

  return (
    <View style={[styles.row, style]} accessibilityRole="text" accessibilityLabel={label}>
      <View
        style={[
          styles.dot,
          { backgroundColor: tone === "positive" ? c.positive : tone === "warning" ? c.gold : c.ink4 },
          // The dot is the "working" cue; a static dot beside "Syncing…" would read as done.
          busy ? { opacity: 0.55 } : null,
        ]}
      />
      <Text variant="meta" tone="ink3" style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

function describe(
  sync: SyncState,
  pending: number,
  lastSyncedAt: number | null,
): { label: string; tone: "positive" | "warning" | "neutral"; busy: boolean } {
  const waiting = pending > 0 ? ` · ${pending} waiting` : "";

  if (sync === "syncing") {
    return { label: `Syncing${waiting}`, tone: "neutral", busy: true };
  }
  if (sync === "offline") {
    // Not an error. The app works with no signal on purpose; this says so rather than
    // showing a red failure for a state the product was designed around.
    return { label: `Saved on this phone${waiting}`, tone: "warning", busy: false };
  }
  if (sync === "synced") {
    const when = lastSyncedAt ? ` · ${sinceLabel(lastSyncedAt)}` : "";
    return {
      label: pending > 0 ? `Backed up${waiting}` : `Backed up${when}`,
      tone: "positive",
      busy: false,
    };
  }
  return { label: `Saved on this phone${waiting}`, tone: "neutral", busy: false };
}

function sinceLabel(at: number, now = Date.now()): string {
  const min = Math.floor(Math.max(0, now - at) / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 18 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  // Sentence case, unlike the caption preset: "Syncing…" and "Backed up" are sentences, and
  // an all-caps status line next to a title reads as a label rather than as a state.
  text: { letterSpacing: 0 },
});
