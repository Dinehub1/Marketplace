import { useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { radius, space } from "@brandcollabs/tokens";
import { useTheme } from "@/lib/theme";
import { useOwner } from "@/lib/owner";
import { Press, Text } from "@/components/ui";
import { Icon } from "@/components/icons";

export type AccountModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function AccountModal({ visible, onClose }: AccountModalProps) {
  const { c, brand } = useTheme();
  const owner = useOwner();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length >= 10;
  const codeValid = code.trim().length === 6;

  async function handleSendOtp() {
    if (!phoneValid) return;
    setError(null);
    setBusy(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await owner.requestOtp(phone);
      setStep("code");
    } catch (e: any) {
      setError(e?.message || "Failed to send verification code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp() {
    if (!codeValid) return;
    setError(null);
    setBusy(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await owner.verifyOtp(phone, code.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(
        "Account Connected",
        "Your account is now linked. Purchases and subscriptions will sync across your devices.",
        [{ text: "Done", onPress: onClose }],
      );
    } catch (e: any) {
      setError(e?.message || "Invalid or expired code.");
    } finally {
      setBusy(false);
    }
  }

  function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out from this device?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          owner.signOut();
          setStep("phone");
          setPhone("");
          setCode("");
          onClose();
        },
      },
    ]);
  }

  function resetState() {
    setStep("phone");
    setCode("");
    setError(null);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={resetState}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.backdrop}
      >
        <View style={[styles.dialog, { backgroundColor: c.canvas, borderColor: c.hairline }]}>
          {/* Header */}
          <View style={styles.headRow}>
            <View style={styles.titleWithIcon}>
              <Icon name="person" size={22} color={brand.primary} />
              <Text variant="title3" style={{ fontWeight: "700" }}>
                {owner.session ? "Your Account" : "Sign In for Cloud Sync"}
              </Text>
            </View>
            <Press onPress={resetState} style={styles.closeBtn}>
              <Text style={{ color: c.ink3, fontSize: 18, fontWeight: "600" }}>✕</Text>
            </Press>
          </View>

          {owner.session ? (
            /* Logged in view */
            <View style={styles.body}>
              <View style={[styles.infoCard, { backgroundColor: c.surfaceRaised, borderColor: c.hairline }]}>
                <Text variant="meta" style={{ color: c.ink3 }}>
                  Signed in with mobile number
                </Text>
                <Text variant="title2" style={{ fontWeight: "800", color: brand.primary, marginTop: 4 }}>
                  +{owner.session.phone}
                </Text>
                <View style={[styles.syncBadge, { backgroundColor: brand.accent + "22" }]}>
                  <Text variant="caption" style={{ color: brand.primary, fontWeight: "700" }}>
                    ✓ SUBSCRIPTIONS SYNCED
                  </Text>
                </View>
              </View>

              <Text variant="meta" style={[styles.helpText, { color: c.ink3 }]}>
                Your Pro purchases are linked to this phone number. Signing in with this number on any device restores your Pro features automatically.
              </Text>

              <Press
                style={[styles.destructiveBtn, { borderColor: "#b42318" }]}
                onPress={handleSignOut}
              >
                <Text variant="body" style={{ color: "#b42318", fontWeight: "700" }}>
                  Sign Out
                </Text>
              </Press>
            </View>
          ) : (
            /* Sign in view */
            <View style={styles.body}>
              <Text variant="meta" style={[styles.helpText, { color: c.ink3 }]}>
                Optional: Sign in to sync your Pro subscription and use it across other phones or the web.
              </Text>

              {step === "phone" ? (
                <>
                  <Text variant="caption" style={{ color: c.ink2, fontWeight: "700", marginBottom: 6 }}>
                    PHONE NUMBER
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={c.ink4}
                    keyboardType="phone-pad"
                    maxLength={14}
                    style={[styles.input, { color: c.ink, backgroundColor: c.surfaceRaised, borderColor: c.hairline }]}
                    autoFocus
                  />

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <Press
                    style={[
                      styles.actionBtn,
                      { backgroundColor: brand.primary },
                      (!phoneValid || busy) && styles.disabledBtn,
                    ]}
                    onPress={handleSendOtp}
                    disabled={!phoneValid || busy}
                  >
                    {busy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text variant="body" style={styles.btnText}>
                        Send WhatsApp / SMS Code
                      </Text>
                    )}
                  </Press>
                </>
              ) : (
                <>
                  <Text variant="caption" style={{ color: c.ink2, fontWeight: "700", marginBottom: 6 }}>
                    ENTER 6-DIGIT CODE SENT TO {phone}
                  </Text>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="6-digit code"
                    placeholderTextColor={c.ink4}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[styles.input, { color: c.ink, backgroundColor: c.surfaceRaised, borderColor: c.hairline }]}
                    autoFocus
                  />

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <Press
                    style={[
                      styles.actionBtn,
                      { backgroundColor: brand.primary },
                      (!codeValid || busy) && styles.disabledBtn,
                    ]}
                    onPress={handleVerifyOtp}
                    disabled={!codeValid || busy}
                  >
                    {busy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text variant="body" style={styles.btnText}>
                        Verify & Link Account
                      </Text>
                    )}
                  </Press>

                  <Press onPress={() => setStep("phone")} style={{ marginTop: space.sm, alignItems: "center" }}>
                    <Text variant="caption" style={{ color: brand.primary }}>
                      ← Change phone number
                    </Text>
                  </Press>
                </>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: space.base,
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.base,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.md,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  closeBtn: {
    padding: space.xs,
  },
  body: {
    gap: space.md,
  },
  helpText: {
    lineHeight: 18,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    alignItems: "center",
    gap: 4,
  },
  syncBadge: {
    marginTop: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    fontWeight: "600",
  },
  actionBtn: {
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.xs,
  },
  destructiveBtn: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: {
    opacity: 0.45,
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  errorText: {
    color: "#b42318",
    fontSize: 12,
    marginTop: 2,
  },
});
