# EAS Build & Launch Sequence

This guide outlines exactly how to generate your production binaries and progress through internal testing to public release for CycleAI.

## Phase 1: Local Pre-Flight Check

Before initiating cloud builds, verify your project locally.
```bash
# Clear cache to ensure name/bundle ID updates take effect
npx expo start -c

# Run type checks, lint checks and test suites (if configured via scripts in .agent)
python .agent/scripts/checklist.py .
```

## Phase 2: Internal Preview Build (Optional, but Recommended)

Build simulated binaries that can run locally on an emulator/simulator to verify the final production configuration (`eas.json` preview profile).

```bash
# Build iOS Simulator
eas build -p ios --profile preview

# Build Android APK (for manual installation on an emulator or physical Android device)
eas build -p android --profile preview
```

## Phase 3: Production Build Generation

Generating the AAB (Android) and IPA (iOS) files.

```bash
# Build for iOS TestFlight (Automatically increments build number)
eas build -p ios --profile testflight

# Build for Google Play Production/Internal
eas build -p android --profile production

# Or, build both simultaneously
eas build --platform all --profile production
```

## Phase 4: Store Submission Sequence

EAS Submit can automate sending binaries to Apple App Store Connect and Google Play Console.

### 4.1 iOS (TestFlight / App Store)

```bash
# Submit latest iOS production build to App Store Connect
eas submit -p ios
```

**Launch Sequence (Apple):**
1. Binaries appear in **App Store Connect > TestFlight > Builds**.
2. Wait for Apple's automated processing (~15-30 minutes).
3. Distribute to **Internal Testing** group (no review required).
4. Distribute to **External Testing** group (requires Beta App Review - ~24 hours).
5. Once stable, submit the exact same build to **App Store > Ready for Sale**.

### 4.2 Android (Google Play)

```bash
# Submit latest Android production build to Google Play Console
eas submit -p android
```

**Launch Sequence (Google):**
1. Binaries appear in **Google Play Console > Internal Testing**.
2. Create an **Internal Testing Release** and add tester emails (instant availability).
3. Promote the release track: **Internal Testing -> Closed Testing -> Production**.
4. (First time apps may require a 14-day Closed Testing phase with 20 opt-in testers before Production access is granted).

## Phase 5: Pushing OTA Updates (Post-Release)

Once the app is live with the `com.cycleai.app` bundle ID, you can push over-the-air updates for Javascript and Asset changes.

```bash
# Push an update to the 'production' channel
eas update --branch production --message "Fixing onboarding typo"
```

*Note: Native code changes (e.g., adding a new module like `expo-camera`) require a full new binary build (Phase 3) and cannot be pushed via OTA.*
