import { useState, useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { radius, space } from "@brandcollabs/tokens";
import { useTheme } from "@/lib/theme";
import { Press, Text } from "@/components/ui";
import {
  getDefaultOffering,
  purchasePackage,
  restorePurchases,
  isPurchasesConfigured,
  type PurchaseResult,
} from "@/lib/purchases";
import type { PurchasesPackage } from "react-native-purchases";

export type PdfPaywallModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenAccount?: () => void;
  featureTrigger?: string;
};

const PRO_FEATURES = [
  "Unlimited PDF Merging (no 3-file limit)",
  "Extreme Compression without quality loss",
  "Custom Page Numbering & Watermark Removal",
  "Batch Rotation & Precise Page Splitting",
  "100% Ad-Free & Priority Server Processing",
];

export function PdfPaywallModal({
  visible,
  onClose,
  onSuccess,
  onOpenAccount,
  featureTrigger,
}: PdfPaywallModalProps) {
  const { c, brand } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [offeringPackages, setOfferingPackages] = useState<{
    monthly?: PurchasesPackage;
    annual?: PurchasesPackage;
  }>({});

  useEffect(() => {
    if (!visible) return;

    async function loadPackages() {
      const offering = await getDefaultOffering();
      if (!offering) return;

      const monthly = offering.monthly ?? offering.availablePackages.find((p) => p.packageType === "MONTHLY");
      const annual = offering.annual ?? offering.availablePackages.find((p) => p.packageType === "ANNUAL");

      setOfferingPackages({ monthly, annual });
    }

    loadPackages();
  }, [visible]);

  async function handlePurchase() {
    if (!isPurchasesConfigured()) {
      Alert.alert(
        "Purchases Unavailable",
        "In-app purchases are currently not configured on this build.",
      );
      return;
    }

    const pkgToBuy =
      selectedPlan === "annual" ? offeringPackages.annual : offeringPackages.monthly;

    if (!pkgToBuy) {
      Alert.alert(
        "Plan Unavailable",
        "Could not load the selected subscription package from the store. Please try again shortly.",
      );
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setLoading(true);

      const result: PurchaseResult = await purchasePackage(pkgToBuy);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert("Welcome to Pro!", "Your PDF Toolkit Pro subscription is now active.", [
          {
            text: "Continue",
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ]);
      } else if (!result.userCancelled) {
        Alert.alert("Purchase Failed", result.error || "Unable to complete purchase.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    if (!isPurchasesConfigured()) {
      Alert.alert("Unavailable", "Purchases are not configured on this build.");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setRestoring(true);
      const result = await restorePurchases();

      if (result.success) {
        const hasPro = Boolean(result.customerInfo.entitlements.active["pdf_pro"]);
        if (hasPro) {
          Alert.alert("Restored!", "Your PDF Toolkit Pro subscription has been restored.", [
            {
              text: "Continue",
              onPress: () => {
                onSuccess?.();
                onClose();
              },
            },
          ]);
        } else {
          Alert.alert("No Subscriptions Found", "No active Pro subscriptions were found for this account.");
        }
      } else {
        Alert.alert("Restore Failed", result.error);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to restore purchases.");
    } finally {
      setRestoring(false);
    }
  }

  const annualPrice = offeringPackages.annual?.product.priceString || "₹1,999/yr";
  const monthlyPrice = offeringPackages.monthly?.product.priceString || "₹299/mo";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: c.canvas }]}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.badge, { backgroundColor: brand.accent + "33" }]}>
                <Text variant="caption" style={{ color: brand.primary, fontWeight: "700" }}>
                  PDF TOOLKIT PRO
                </Text>
              </View>
              <Text variant="title2" style={styles.title}>
                Unlock Unlimited PDF Power
              </Text>
              {featureTrigger ? (
                <Text variant="meta" style={styles.triggerText}>
                  {featureTrigger}
                </Text>
              ) : (
                <Text variant="meta" style={styles.subText}>
                  Process large documents with zero limits, high-speed exports, and no watermarks.
                </Text>
              )}
            </View>

            {/* Feature List */}
            <View style={[styles.featuresCard, { backgroundColor: c.surfaceRaised, borderColor: c.hairline }]}>
              {PRO_FEATURES.map((feat, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={[styles.checkMark, { color: brand.primary }]}>✓</Text>
                  <Text variant="body" style={styles.featureText}>
                    {feat}
                  </Text>
                </View>
              ))}
            </View>

            {/* Pricing Options */}
            <View style={styles.plansContainer}>
              {/* Annual Plan */}
              <Press
                style={[
                  styles.planCard,
                  { backgroundColor: c.surfaceRaised, borderColor: selectedPlan === "annual" ? brand.primary : c.hairline },
                  selectedPlan === "annual" && styles.planCardActive,
                ]}
                onPress={() => setSelectedPlan("annual")}
              >
                <View style={[styles.saveBadge, { backgroundColor: brand.primary }]}>
                  <Text variant="caption" style={styles.saveBadgeText}>
                    SAVE 45% · BEST VALUE
                  </Text>
                </View>
                <View style={styles.planHead}>
                  <Text variant="title3" style={{ fontWeight: "700" }}>Annual Pro</Text>
                  <Text variant="title3" style={{ color: brand.primary, fontWeight: "700" }}>
                    {annualPrice}
                  </Text>
                </View>
                <Text variant="meta" style={styles.planSub}>
                  Billed once a year (~₹166/month)
                </Text>
              </Press>

              {/* Monthly Plan */}
              <Press
                style={[
                  styles.planCard,
                  { backgroundColor: c.surfaceRaised, borderColor: selectedPlan === "monthly" ? brand.primary : c.hairline },
                  selectedPlan === "monthly" && styles.planCardActive,
                ]}
                onPress={() => setSelectedPlan("monthly")}
              >
                <View style={styles.planHead}>
                  <Text variant="title3" style={{ fontWeight: "700" }}>Monthly Pro</Text>
                  <Text variant="title3" style={{ color: brand.primary, fontWeight: "700" }}>
                    {monthlyPrice}
                  </Text>
                </View>
                <Text variant="meta" style={styles.planSub}>
                  Billed monthly · Cancel anytime
                </Text>
              </Press>
            </View>

            {/* Subscribe CTA */}
            <Press
              style={[styles.ctaButton, { backgroundColor: brand.primary }]}
              onPress={handlePurchase}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text variant="body" style={styles.ctaText}>
                  {selectedPlan === "annual" ? "Start Annual Pro" : "Start Monthly Pro"}
                </Text>
              )}
            </Press>

            {/* Restore and Close Links */}
            <View style={styles.footerRow}>
              <Press onPress={handleRestore} disabled={restoring}>
                <Text variant="caption" style={[styles.footerLink, { color: c.ink3 }]}>
                  {restoring ? "Restoring..." : "Restore Purchases"}
                </Text>
              </Press>
              {onOpenAccount ? (
                <>
                  <Text style={{ color: c.ink3 }}>•</Text>
                  <Press onPress={() => { onClose(); onOpenAccount(); }}>
                    <Text variant="caption" style={[styles.footerLink, { color: brand.primary, fontWeight: "700" }]}>
                      Sign In to Sync
                    </Text>
                  </Press>
                </>
              ) : null}
              <Text style={{ color: c.ink3 }}>•</Text>
              <Press onPress={onClose}>
                <Text variant="caption" style={[styles.footerLink, { color: c.ink3 }]}>
                  Maybe Later
                </Text>
              </Press>
            </View>

            {/* Compliance notice */}
            <Text variant="caption" style={[styles.disclaimer, { color: c.ink4 }]}>
              Payment will be charged to your App Store or Google Play account. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. Manage or cancel in Store Account Settings anytime.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: "92%",
  },
  content: {
    padding: space.base,
    paddingBottom: Platform.OS === "ios" ? space.xl : space.base,
  },
  header: {
    alignItems: "center",
    marginBottom: space.base,
  },
  badge: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    marginBottom: space.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: space.sm,
  },
  subText: {
    textAlign: "center",
    paddingHorizontal: space.md,
  },
  triggerText: {
    textAlign: "center",
    color: "#b91c1c",
    fontWeight: "600",
    paddingHorizontal: space.md,
  },
  featuresCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.base,
    gap: space.sm,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  checkMark: {
    fontSize: 16,
    fontWeight: "800",
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  plansContainer: {
    gap: space.md,
    marginBottom: space.base,
  },
  planCard: {
    borderWidth: 2,
    borderRadius: radius.md,
    padding: space.md,
    position: "relative",
  },
  planCardActive: {
    transform: [{ scale: 1.01 }],
  },
  saveBadge: {
    position: "absolute",
    top: -10,
    right: space.md,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  saveBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  planHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  planSub: {
    fontSize: 12,
  },
  ctaButton: {
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.md,
  },
  ctaText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: space.md,
    marginBottom: space.md,
  },
  footerLink: {
    textDecorationLine: "underline",
    fontSize: 12,
  },
  disclaimer: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
  },
});
