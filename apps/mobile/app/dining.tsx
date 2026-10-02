import { useState } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { Text, Card, StatCard, ListItem, Button, Badge, Chip } from "@/components/ui";
import { space } from "@hermes/tokens";

export default function DiningScreen() {
  const { c } = useTheme();
  const [activeTab, setActiveTab] = useState<"reserve" | "events" | "vouchers">("reserve");

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: c.canvas }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="title1" tone="ink">
              Swaad Ghar
            </Text>
            <Text variant="callout" tone="ink2">
              Indore Dining, Table Booking & Food Events
            </Text>
          </View>
          <Badge label="DropBy Food" tone="brand" />
        </View>

        {/* Tab Filters */}
        <View style={styles.tabRow}>
          <Chip label="Table Booking" active={activeTab === "reserve"} onPress={() => setActiveTab("reserve")} />
          <Chip label="Live Events" active={activeTab === "events"} onPress={() => setActiveTab("events")} />
          <Chip label="Bill Pay & Vouchers" active={activeTab === "vouchers"} onPress={() => setActiveTab("vouchers")} />
        </View>

        {/* Metrics Row */}
        <View style={styles.statsRow}>
          <StatCard
            label="Active Bookings"
            value="1"
            subtext="Table for 4 tonight"
            tone="brandPrimary"
            style={{ flex: 1 }}
          />
          <StatCard
            label="Reward Coins"
            value="450"
            subtext="Worth ₹450 off bill"
            tone="gold"
            style={{ flex: 1 }}
          />
        </View>

        {/* Dynamic Content Card */}
        <Card style={styles.sectionCard}>
          <Text variant="title3" tone="ink" style={styles.sectionTitle}>
            {activeTab === "reserve"
              ? "Popular Dining Tables"
              : activeTab === "events"
              ? "Upcoming Food Festivals"
              : "Dining Discounts & Passes"}
          </Text>

          {activeTab === "reserve" ? (
            <>
              <ListItem
                title="The Saffron Rooftop"
                subtitle="Vijay Nagar • North Indian & Mughlai • 4.8 ★"
                right={<Badge label="Fast Booking" tone="brand" />}
                onPress={() => {}}
              />
              <ListItem
                title="Nafees Restaurant"
                subtitle="Old Palasia • Biryani & Kebabs • Instant confirmation"
                onPress={() => {}}
              />
              <ListItem
                title="Mediterra Terrace Lounge"
                subtitle="Sayaji Hotel • Mediterranean & Cocktails"
                right={<Badge label="10% OFF" tone="positive" />}
                onPress={() => {}}
              />
              <ListItem
                title="Vidorra Lounge"
                subtitle="AB Road • Live Music & Continental"
                onPress={() => {}}
              />
            </>
          ) : activeTab === "events" ? (
            <>
              <ListItem
                title="Indore Street Food Carnival 2026"
                subtitle="Chappan Dukan Arena • Oct 15-18 • 40+ Master Chefs"
                right={<Badge label="Tickets Open" tone="brand" />}
                onPress={() => {}}
              />
              <ListItem
                title="Craft Beer & Grill Fest"
                subtitle="Tapas Lounge • Saturday 07:00 PM"
                right={<Badge label="Selling Fast" tone="gold" />}
                onPress={() => {}}
              />
              <ListItem
                title="Sufi Night & Candlelight Dinner"
                subtitle="Skyfall Lounge • Friday Evening"
                onPress={() => {}}
              />
            </>
          ) : (
            <>
              <ListItem
                title="Direct Table Bill Pay"
                subtitle="Enter table code to pay with UPI & get 15% cashback"
                right={<Badge label="UPI Pay" tone="positive" />}
                onPress={() => {}}
              />
              <ListItem
                title="DropBy Dining Pass (₹499)"
                subtitle="Flat 20% discount across 40 premium restaurants"
                onPress={() => {}}
              />
              <ListItem
                title="Happy Hours Voucher"
                subtitle="1+1 on starters between 4 PM to 7 PM"
                onPress={() => {}}
              />
            </>
          )}
        </Card>

        {/* Active Booking Banner */}
        <Card style={styles.bannerCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text variant="title3" tone="ink">
              Tonight's Reservation
            </Text>
            <Badge label="Confirmed" tone="positive" />
          </View>
          <Text variant="caption" tone="ink2" style={{ marginTop: 4 }}>
            The Saffron Rooftop • 8:30 PM • 4 Guests • Table #14
          </Text>
          <View style={{ marginTop: space.sm, flexDirection: "row", gap: space.sm }}>
            <Button
              title="Show QR at Venue"
              variant="primary"
              style={{ flex: 1 }}
              onPress={() => {}}
            />
            <Button
              title="Directions"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => {}}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: space.md, gap: space.md, paddingBottom: space.xxl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabRow: {
    flexDirection: "row",
    gap: space.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: space.sm,
  },
  sectionCard: {
    padding: space.md,
    gap: space.xs,
  },
  sectionTitle: {
    marginBottom: space.xs,
  },
  bannerCard: {
    padding: space.md,
  },
});
