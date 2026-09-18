import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { useOwner } from "@/lib/owner";
import { Button, Press, Text } from "@/components/ui";
import { Icon } from "@/components/icons";

type Step = "phone" | "code";

export default function OwnerSignIn() {
  const { c, brand } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const owner = useOwner();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const codeRef = useRef<TextInput>(null);

  const phoneValid = phone.replace(/\D/g, "").length >= 10;

  async function send() {
    setBusy(true);
    setError("");
    try {
      await owner.requestOtp(phone);
      setStep("code");
      // Focus follows the task: the user's next action is typing the code, so
      // the keyboard should already be there when the step changes.
      setTimeout(() => codeRef.current?.focus(), 250);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError("");
    try {
      await owner.verifyOtp(phone, code);
      router.replace("/owner");
    } catch (e) {
      setError((e as Error).message);
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.sm,
          paddingHorizontal: space.base,
          paddingBottom: space.xxl,
          gap: space.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Press
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (step === "code" ? setStep("phone") : router.back())}
          style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -10 }}
        >
          <Icon name="back" size={22} color={c.ink} strokeWidth={2} />
        </Press>

        <View style={{ gap: space.sm }}>
          <Text variant="hero">{step === "phone" ? "Sign in" : "Enter the code"}</Text>
          <Text variant="lede" tone="ink2">
            {step === "phone"
              ? "We'll send a one-time code to your WhatsApp number."
              : `Sent to ${phone}. It expires in a few minutes.`}
          </Text>
        </View>

        {step === "phone" ? (
          <View style={{ gap: space.sm }}>
            <Text variant="meta" tone="ink2">
              WhatsApp number
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="98765 43210"
              placeholderTextColor={c.ink4}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              accessibilityLabel="WhatsApp number"
              style={[styles.input, { backgroundColor: c.surface, color: c.ink, borderColor: c.hairlineStrong }]}
            />
            <Button title={busy ? "Sending…" : "Send code"} disabled={!phoneValid || busy} onPress={send} />
          </View>
        ) : (
          <View style={{ gap: space.sm }}>
            <TextInput
              ref={codeRef}
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={c.ink4}
              keyboardType="number-pad"
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              accessibilityLabel="One-time code"
              style={[
                styles.input,
                styles.code,
                { backgroundColor: c.surface, color: c.ink, borderColor: c.hairlineStrong },
              ]}
            />
            <Button
              title={busy ? "Verifying…" : "Verify"}
              disabled={code.length < 4 || busy}
              haptic="success"
              onPress={verify}
            />
            <Button title="Send a new code" variant="ghost" disabled={busy} onPress={send} />
          </View>
        )}

        {/* Errors are announced, not just coloured: colour alone is not a signal
            everyone can perceive. */}
        {error ? (
          <View
            accessibilityRole="alert"
            style={{ backgroundColor: c.criticalTint, padding: space.md, borderRadius: radius.sm }}
          >
            <Text variant="meta" style={{ color: c.critical }}>
              {error}
            </Text>
          </View>
        ) : null}

        <Text variant="meta" tone="ink3">
          Signing in lets you see leads for listings registered to this number. Browsing the
          directory never requires an account.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    paddingHorizontal: 15,
    paddingVertical: 14,
    // Never below 16pt: iOS zooms the viewport on smaller input text, and on
    // native it is simply the floor for comfortable entry.
    fontSize: 17,
  },
  code: { textAlign: "center", fontSize: 28, letterSpacing: 10, fontWeight: "700" },
});
