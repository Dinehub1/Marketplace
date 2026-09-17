import { Redirect, type Href } from "expo-router";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space } from "@hermes/tokens";
import { Card, Text } from "@/components/ui";
import { TARGET } from "@/lib/target";
import { unbuiltProductsFor } from "@/lib/products";

/**
 * The first frame of all twenty apps.
 *
 * This route exists because "twenty separate apps" has to mean something the user can
 * see, and the first thing they see is this. Each target sends its build straight to the
 * screen its store listing promises: Breathe opens on the breathing circle, Tap Sprint on
 * the game, the directory apps on the listing feed.
 *
 * Before this, every target opened on the marketplace feed — so a build named "Breathe"
 * showed a business directory on launch. That is the exact shape Apple rejects under
 * guideline 4.3 (and Play under "Spam and Minimum Functionality"), and it is also just
 * wrong for the person who installed it.
 *
 * When a target's first screen is not built, this says so instead of redirecting anywhere.
 * See FIRST_ROUTE in targets.mjs for which targets are still owed a screen.
 */
export default function Entry() {
  const route = TARGET.firstRoute;
  // A module constant, so this branch never changes between renders and calling no hooks
  // above it is safe.
  if (route) return <Redirect href={route as Href} />;
  return <FirstScreenNotBuilt />;
}

function FirstScreenNotBuilt() {
  const insets = useSafeAreaInsets();
  const owed = unbuiltProductsFor(TARGET.products);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: space.lg,
        paddingTop: insets.top + space.xxl,
        paddingBottom: space.xxl,
        gap: space.md,
      }}
    >
      <Text variant="title1">{TARGET.name}</Text>
      <Text variant="lede" tone="ink2">
        {TARGET.tagline}
      </Text>

      <Card>
        <Text variant="caption" tone="ink3">
          THIS APP HAS NO FIRST SCREEN YET
        </Text>
        <Text variant="meta" tone="ink2" style={{ marginTop: space.sm }}>
          {TARGET.name} is meant to open on its own product. That screen has not been built, so
          this build says so rather than opening the marketplace and calling it this app. A
          listing whose first screen is a different product is the fastest route to a
          duplicate-app rejection — and it would be a lie to whoever installed it.
        </Text>
      </Card>

      {owed.length > 0 ? (
        <Card>
          <Text variant="caption" tone="ink3">
            STILL OWED TO THIS LISTING
          </Text>
          {owed.map((p) => (
            <Text key={p.slug} variant="meta" tone="ink2" style={{ marginTop: space.sm }}>
              <Text variant="meta" style={{ fontWeight: "600" }}>
                {p.label}
              </Text>
              {" — "}
              {p.blurb}
            </Text>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}
