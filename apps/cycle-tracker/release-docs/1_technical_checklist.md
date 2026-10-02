# CycleAI Rebranding & Release Technical Checklist

This structured checklist ensures a safe transition from the old branding to CycleAI while maintaining EAS OTA compatibility.

## 1. Expo Project & EAS Rebranding
- [x] **Update `app.json` basics:** Change `expo.name` to "CycleAI" and `expo.slug` to "cycleai".
- [x] **Update Identifiers:** Change `ios.bundleIdentifier` and `android.package` to `com.cycleai.app`.
- [x] **Preserve EAS Project ID:** Ensure `expo.extra.eas.projectId` remains exactly the same as before to map to your existing EAS project and not lose history/OTAs.
- [ ] **Reset OTA Updates Compatibility:** If you change the bundle identifier, previously pushed OTA updates will NOT apply to the newly built app, which is expected. However, any new updates pushed must match the new native runtime. 
- [ ] **Update URL Scheme:** Change `expo.scheme` to `cycleai` to ensure deep linking works with the new name.
- [ ] **Run Prebuild to Sync:** Run `npx expo prebuild --clean` to regenerate the Android and iOS folders if you aren't strictly using Expo Go (this ensures native files match the new bundle ID).

## 2. Versioning Strategy
- [x] **Base Version:** Keep `expo.version` at `1.0.0` for the initial Store release.
- [x] **iOS buildNumber:** Start at `"1"`.
- [x] **Android versionCode:** Start at `1`.
- [x] **Enable auto-increment:** Handled via `eas.json` (`autoIncrement: true` for remote tracking of build numbers).

## 3. Assets & Branding
- [ ] **App Icon:** Validate `icon.png` in `./assets/images/` reflects CycleAI branding.
- [ ] **Splash Screen:** Validate `splash-icon.png` is updated.
- [ ] **Adaptive Icon (Android):** Validate `android-icon-foreground.png` and its background color.
- [ ] **Clear cache:** Run `expo start -c` to ensure old cached assets are flushed.

## 4. EAS Build Profiles
- [x] **Production Profile:** Configured for app stores (`submit: true`, auto-increments).
- [x] **Preview Profile:** Configured for internal testing (TestFlight / Google Play Internal / EAS Internal) utilizing standard distribution.
- [x] **Development Profile:** Configured for local development client (`developmentClient: true`).

## 5. OTA Updates Safety Check
To avoid breaking OTA (`expo-updates`):
- Since the `bundleIdentifier` and `package` changed, the new build will constitute a **new native runtime version**.
- New OTA updates must be published using the command: `eas update --branch production --message "CycleAI initial release"`
- Old users (on old bundle ID) will NOT receive updates intended for the new bundle ID. They must download the new app from the store. If this is an existing live app, consider if changing the bundle ID is strictly necessary (usually it forces users to install a "new" app, losing local data unless migrated via a cloud backend). Assuming this is a pre-release rebrand, changing the bundle ID is completely safe.

## 6. Pre-Submission Verification
- [ ] Generate production build for iOS simulator: `eas build -p ios --profile preview`
- [ ] Generate production build for Android emulator: `eas build -p android --profile preview`
- [ ] Test the exact build artifacts locally before Store submission.
