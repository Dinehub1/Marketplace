import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { listBusinesses, PAGE_SIZE, type Business } from "@/lib/api";
import { BRAND } from "@/lib/config";
import { CITY_LABEL } from "@hermes/core";
import { Button, Card, EmptyState, Skeleton, Text } from "@/components/ui";
import { BusinessCard } from "@/components/business-card";

export default function BrowseScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  const [rows, setRows] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const loadingMore = useRef(false);

  const load = useCallback(async (targetPage: number, replace: boolean) => {
    try {
      const { rows: next, total: t } = await listBusinesses({ page: targetPage });
      setRows((prev) => (replace ? next : [...prev, ...next]));
      setTotal(t);
      setState("ready");
    } catch {
      // An error must say what to do next, not just that something went wrong.
      if (replace) setState("error");
    } finally {
      loadingMore.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Deferred by a microtask so the loader's state writes are not on the effect's
      // synchronous path; `load` is shared with pull-to-refresh and paging.
      await Promise.resolve();
      if (!cancelled) await load(1, true);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onEndReached = () => {
    if (loadingMore.current || state !== "ready" || rows.length >= total) return;
    loadingMore.current = true;
    const next = page + 1;
    setPage(next);
    void load(next, false);
  };

  return (
    <FlatList
      data={state === "loading" ? [] : rows}
      keyExtractor={(b) => String(b.id)}
      renderItem={({ item }) => <BusinessCard b={item} />}
      contentContainerStyle={{
        paddingTop: insets.top + space.base,
        paddingBottom: space.xxl,
        paddingHorizontal: space.base,
        gap: space.md,
        flexGrow: 1,
      }}
      ListHeaderComponent={
        <View style={{ marginBottom: space.sm }}>
          <Text variant="caption" tone="ink3">
            {CITY_LABEL} directory
          </Text>
          <Text variant="hero" style={{ marginTop: space.sm }}>
            {BRAND.name}
          </Text>
          <Text variant="lede" tone="ink2" style={{ marginTop: space.sm }}>
            {total > 0
              ? `${total.toLocaleString("en-IN")} verified businesses you can call straight away.`
              : "Verified local businesses you can call straight away."}
          </Text>
        </View>
      }
      ListEmptyComponent={
        state === "loading" ? (
          <View style={{ gap: space.md }}>
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} style={{ padding: space.base, gap: space.sm }}>
                <Skeleton height={18} width="70%" />
                <Skeleton height={13} width="45%" />
                <Skeleton height={44} style={{ marginTop: space.sm }} />
              </Card>
            ))}
          </View>
        ) : state === "error" ? (
          <EmptyState
            title="Couldn't load the directory"
            body="Check your connection and try again — nothing has been lost."
            action={<Button title="Try again" onPress={() => { setState("loading"); void load(1, true); }} />}
          />
        ) : (
          <EmptyState title="No listings yet" body="Check back shortly." />
        )
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      ListFooterComponent={
        rows.length > 0 && rows.length < total ? (
          <View style={{ paddingVertical: space.lg }}>
            <Skeleton height={80} />
          </View>
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={c.ink3}
          onRefresh={async () => {
            setRefreshing(true);
            setPage(1);
            await load(1, true);
            setRefreshing(false);
          }}
        />
      }
      // Momentum matters: the list must decelerate the way the platform's own
      // lists do, so a flick lands where the user expects.
      showsVerticalScrollIndicator={false}
      initialNumToRender={PAGE_SIZE}
    />
  );
}
