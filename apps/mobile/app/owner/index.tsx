import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { useOwner } from "@/lib/owner";
import { WEB_BASE_URL } from "@/lib/config";
import { formatCount } from "@hermes/core";
import { Button, Card, EmptyState, Press, Skeleton, Text } from "@/components/ui";
import { Icon } from "@/components/icons";

// Mirrors the /api/customer response. leads.id is a uuid, not a bigint — it is
// the React key for every row on this screen, so getting it wrong here is the
// kind of thing that types quietly stop protecting you from.
type Lead = { id: string; name: string | null; phone: string | null; message: string | null; created_at: string };
type Owned = { id: number; name: string; category: string | null; status: string | null; city: string | null };

export default function OwnerDashboard() {
  const { c, brand } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const owner = useOwner();

  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [owned, setOwned] = useState<Owned[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!owner.ready) return;
    if (!owner.session) {
      router.replace("/owner/sign-in");
      return;
    }
    const ctrl = new AbortController();
    // One endpoint, one round trip: a phone on a weak connection should not pay
    // for three sequential requests to paint one screen.
    //
    // The phone token goes in x-phone-token, NOT in Authorization. The route
    // reads a Bearer header as a Supabase JWT and hands it to auth.getUser();
    // a phone token sent that way fails that check and never reaches the branch
    // that would have accepted it, so the screen 401s with a valid session.
    fetch(`${WEB_BASE_URL}/api/customer`, {
      headers: {
        "x-phone": owner.session.phone,
        "x-phone-token": owner.session.token,
      },
      signal: ctrl.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text().catch(() => "Request failed"));
        return r.json() as Promise<{ ownerLeads?: Lead[]; businesses?: Owned[] }>;
      })
      .then((d) => {
        // ownerLeads, not leads: this screen is the business's inbox. `leads`
        // is the enquiries this phone *sent* as a customer, which belongs to
        // the customer dashboard on the web.
        setLeads(d.ownerLeads ?? []);
        setOwned(d.businesses ?? []);
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") {
          setError("Couldn't load your dashboard. Pull down to retry.");
          setLeads([]);
          setOwned([]);
        }
      });
    return () => ctrl.abort();
  }, [owner.ready, owner.session, router]);

  const loading = leads === null || owned === null;

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + space.sm,
        paddingHorizontal: space.base,
        paddingBottom: space.xxl,
        gap: space.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Press
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => router.back()}
        style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -10 }}
      >
        <Icon name="back" size={22} color={c.ink} strokeWidth={2} />
      </Press>

      <View>
        <Text variant="caption" tone="ink3">
          Business dashboard
        </Text>
        <Text variant="hero" style={{ marginTop: space.sm }}>
          Your leads
        </Text>
      </View>

      {loading ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={84} />
          <Skeleton height={84} />
          <Skeleton height={84} />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <Stat label="Leads" value={formatCount(leads.length)} />
            <Stat label="Listings" value={formatCount(owned.length)} />
          </View>

          {error ? (
            <Card style={{ padding: space.base, backgroundColor: c.criticalTint }}>
              <Text variant="meta" style={{ color: c.critical }}>
                {error}
              </Text>
            </Card>
          ) : null}

          {leads.length === 0 ? (
            <EmptyState
              title="No leads yet"
              body="When someone enquires through your listing, it appears here with their number."
              action={<Button title="View my listings" variant="secondary" onPress={() => router.back()} />}
            />
          ) : (
            <View style={{ gap: space.md }}>
              {leads.map((l) => (
                <Card key={l.id} style={{ padding: space.base, gap: 6 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.sm }}>
                    <Text variant="callout">{l.name ?? "Enquiry"}</Text>
                    <Text variant="meta" tone="ink3">
                      {new Date(l.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </Text>
                  </View>
                  {l.phone && (
                    <Text variant="meta" style={{ color: brand.secondary, fontWeight: "600" }}>
                      {l.phone}
                    </Text>
                  )}
                  {l.message && (
                    <Text variant="meta" tone="ink2">
                      {l.message}
                    </Text>
                  )}
                </Card>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, padding: space.base }}>
      {/* Tabular figures: a stat row with proportional numerals looks ragged
          because a "1" is narrower than a "0". */}
      <Text variant="title1" style={{ fontVariant: ["tabular-nums"] }}>
        {value}
      </Text>
      <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
        {label}
      </Text>
    </Card>
  );
}
