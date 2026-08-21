import { useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { listBusinesses, type Business } from "@/lib/api";
import { Chip, EmptyState, Skeleton, Text, Card } from "@/components/ui";
import { BusinessCard } from "@/components/business-card";
import { Icon } from "@/components/icons";

const SUGGESTIONS = ["Electrician", "Plumber", "Carpenter", "Hospital", "Restaurant", "Pest Control"];

export default function SearchScreen() {
  const { c, brand, elevation } = useTheme();
  const insets = useSafeAreaInsets();

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Business[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [focused, setFocused] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setState("idle");
      setRows([]);
      return;
    }

    setState("loading");
    // 220ms is short enough to feel like the list is tracking the keystrokes
    // and long enough that a fast typist fires one request, not eight.
    const timer = setTimeout(async () => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      try {
        const { rows: next } = await listBusinesses({ q: term, signal: ctrl.signal });
        setRows(next);
        setState("ready");
      } catch (e) {
        // An aborted request is a superseded one, not a failure — showing an
        // error for it would flash a spurious message on every keystroke.
        if ((e as Error)?.name !== "AbortError") setState("error");
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [q]);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + space.sm }}>
      <View style={{ paddingHorizontal: space.base, paddingBottom: space.md }}>
        <View
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              gap: space.sm,
              paddingHorizontal: space.md,
              minHeight: 50,
              borderRadius: radius.lg,
              backgroundColor: c.surfaceRaised,
              borderWidth: focused ? 1.5 : StyleSheet.hairlineWidth,
              borderColor: focused ? brand.secondary : c.hairline,
            },
            elevation(focused ? 2 : 1),
          ]}
        >
          <Icon name="search" size={19} color={c.ink3} strokeWidth={1.9} />
          <TextInput
            value={q}
            onChangeText={setQ}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search businesses or a category"
            placeholderTextColor={c.ink4}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            accessibilityLabel="Search businesses"
            style={{ flex: 1, fontSize: 16, color: c.ink, paddingVertical: 12 }}
          />
        </View>
      </View>

      <FlatList
        data={state === "ready" ? rows : []}
        keyExtractor={(b) => String(b.id)}
        renderItem={({ item }) => <BusinessCard b={item} />}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: space.base,
          paddingBottom: space.xxl,
          gap: space.md,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          state === "loading" ? (
            <View style={{ gap: space.md }}>
              {[0, 1, 2].map((i) => (
                <Card key={i} style={{ padding: space.base, gap: space.sm }}>
                  <Skeleton height={18} width="65%" />
                  <Skeleton height={13} width="40%" />
                </Card>
              ))}
            </View>
          ) : state === "error" ? (
            <EmptyState title="Search failed" body="Check your connection and try again." />
          ) : state === "ready" ? (
            <EmptyState
              title={`Nothing found for “${q.trim()}”`}
              body="Check the spelling, or try a broader category."
            />
          ) : (
            <View style={{ paddingTop: space.lg }}>
              <Text variant="caption" tone="ink3" style={{ marginBottom: space.md }}>
                Popular searches
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {SUGGESTIONS.map((s) => (
                  <Chip key={s} label={s} onPress={() => setQ(s)} />
                ))}
              </View>
            </View>
          )
        }
      />
    </View>
  );
}
