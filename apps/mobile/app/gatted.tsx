import { useState } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { Text, Card, StatCard, ListItem, Button, Badge, Chip } from "@/components/ui";
import { space } from "@brandcollabs/tokens";

export default function GattedScreen() {
  const { c } = useTheme();
  const [role, setRole] = useState<"resident" | "guard" | "manager">("resident");

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: c.canvas }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="title1" tone="ink">
              Padosi Gate
            </Text>
            <Text variant="callout" tone="ink2">
              Gulmohar Heights Society • Block B-402
            </Text>
          </View>
          <Badge label="Gated ERP" tone="brand" />
        </View>

        {/* Role Switcher */}
        <View style={styles.roleChips}>
          <Chip label="Resident" active={role === "resident"} onPress={() => setRole("resident")} />
          <Chip label="Guard Desk" active={role === "guard"} onPress={() => setRole("guard")} />
          <Chip label="Society Manager" active={role === "manager"} onPress={() => setRole("manager")} />
        </View>

        {/* Live Overview Stats */}
        <View style={styles.statsRow}>
          <StatCard
            label="Active Visitors"
            value="3"
            subtext="2 pre-approved"
            style={{ flex: 1 }}
          />
          <StatCard
            label="Parcels at Gate"
            value="2"
            subtext="Amazon, Zomato"
            tone="brandPrimary"
            style={{ flex: 1 }}
          />
        </View>

        {/* Quick Actions Card */}
        <Card style={styles.sectionCard}>
          <Text variant="title3" tone="ink" style={styles.sectionTitle}>
            {role === "resident"
              ? "Resident Services"
              : role === "guard"
              ? "Guard Operations"
              : "Management Desk"}
          </Text>

          {role === "resident" ? (
            <>
              <ListItem
                title="Pre-approve Guest"
                subtitle="Share digital entry pass QR with visitor"
                onPress={() => {}}
              />
              <ListItem
                title="Parcels & Deliveries"
                subtitle="2 packages waiting at Guard Cabin"
                right={<Badge label="2 New" tone="positive" />}
                onPress={() => {}}
              />
              <ListItem
                title="Society Announcements"
                subtitle="Clubhouse maintenance scheduled for Sunday"
                onPress={() => {}}
              />
              <ListItem
                title="Raise Society Issue"
                subtitle="Lift breakdown, plumbing, or common area ticket"
                onPress={() => {}}
              />
            </>
          ) : role === "guard" ? (
            <>
              <ListItem
                title="Visitor Fast Check-In"
                subtitle="Scan visitor QR pass or verify phone OTP"
                right={<Badge label="Scanner" tone="brand" />}
                onPress={() => {}}
              />
              <ListItem
                title="Log Walk-In Entry"
                subtitle="Record delivery executive or cab number"
                onPress={() => {}}
              />
              <ListItem
                title="Parcel Inward Log"
                subtitle="Snap photo & assign to unit number"
                onPress={() => {}}
              />
              <ListItem
                title="Emergency Guard Buzzer"
                subtitle="Broadcast panic notification to all residents"
                right={<Badge label="SOS" tone="critical" />}
                onPress={() => {}}
              />
            </>
          ) : (
            <>
              <ListItem
                title="Society Directory & Units"
                subtitle="240 occupied units, 18 vacant"
                onPress={() => {}}
              />
              <ListItem
                title="Maintenance & Dues"
                subtitle="₹1,84,000 collected this month (92%)"
                onPress={() => {}}
              />
              <ListItem
                title="Active Complaints Queue"
                subtitle="4 unresolved tickets pending assignment"
                right={<Badge label="4 Open" tone="gold" />}
                onPress={() => {}}
              />
              <ListItem
                title="Broadcast Notice"
                subtitle="Send WhatsApp & push notice to all members"
                onPress={() => {}}
              />
            </>
          )}
        </Card>

        {/* Security Summary Banner */}
        <Card style={styles.bannerCard}>
          <Text variant="title3" tone="ink">
            Gate Security Active
          </Text>
          <Text variant="caption" tone="ink2" style={{ marginTop: 2 }}>
            Guard Shift: Rajesh Kumar (Main Gate #1) • Shift ends 08:00 AM
          </Text>
          <View style={{ marginTop: space.sm }}>
            <Button
              title="View Gate Camera & Logs"
              variant="secondary"
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
  roleChips: {
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
