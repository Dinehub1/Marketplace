# 🔍 Cycle Tracker App — Audit Report

> Audited: 2026-02-21  
> Repo: [github.com/Dinehub1/Cycle-Tracker-App](https://github.com/Dinehub1/Cycle-Tracker-App)  
> Platform: Expo SDK 54 / React Native / TypeScript

---

## ✅ Project Overview

A **menstrual cycle tracking mobile app** with a purple-themed UI inspired by the Stitch design system.

| Item | Detail |
|---|---|
| Framework | Expo SDK 54 + Expo Router (file-based nav) |
| Language | TypeScript |
| Navigation | Expo Router + `@react-navigation/bottom-tabs` |
| Storage | AsyncStorage (local-only, offline-first) |
| Fonts | Manrope via `@expo-google-fonts/manrope` |
| Charts | `react-native-chart-kit` + `react-native-calendars` |

---

## 🗺️ Screen Inventory

### Tab Screens (5)
| Route | File | Status |
|---|---|---|
| `/` | `app/(tabs)/index.tsx` | ✅ Implemented |
| `/history` | `app/(tabs)/history.tsx` | ✅ Implemented |
| `/insights` | `app/(tabs)/insights.tsx` | ✅ Implemented |
| `/discover` | `app/(tabs)/discover.tsx` | ✅ Implemented |
| `/profile` | `app/(tabs)/profile.tsx` | ✅ Implemented |

### Modal / Stack Screens (6)
| Route | File | Status |
|---|---|---|
| `/onboarding` | `app/onboarding.tsx` | ✅ Implemented |
| `/pin-lock` | `app/pin-lock.tsx` | ✅ Implemented |
| `/log-symptoms` | `app/log-symptoms.tsx` | ✅ Implemented |
| `/notifications` | `app/notifications.tsx` | ✅ Implemented |
| `/privacy` | `app/privacy.tsx` | ✅ Implemented |
| `/partner-sync` | `app/partner-sync.tsx` | ✅ Implemented |

---

## 🐛 Bugs & Issues Found

### 🔴 Critical

#### 1. PIN stored as plaintext in AsyncStorage
**File:** `services/storage.ts` — `setPin()` / `getPin()`  
```ts
// ❌ CURRENT — PIN stored raw
export async function setPin(pin: string): Promise<boolean> {
    return setItem(STORAGE_KEYS.PIN, pin);
}
```
**Risk:** Any tool with AsyncStorage access can read the PIN in plain text.  
**Fix:** Hash the PIN with `expo-crypto` (SHA-256) before storing.

```ts
import * as Crypto from 'expo-crypto';

export async function setPin(pin: string): Promise<boolean> {
    const hashed = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256, pin
    );
    return setItem(STORAGE_KEYS.PIN, hashed);
}
```

---

#### 2. Duplicate `clearAll` / `clearAllData` functions
**File:** `services/storage.ts` — lines 42–51 and 132–141  
Both `clearAll()` and `clearAllData()` do exactly the same thing. This is dead code and causes confusion.  
**Fix:** Remove `clearAll()`, keep only `clearAllData()`.

---

### 🟡 Warnings

#### 3. `context.md` is out of sync with actual source
The documentation has stale interfaces that don't match the real code:

| Field | `context.md` | Actual `types/index.ts` |
|---|---|---|
| `CycleData.cycles` | `cycles: CycleEntry[]` | `entries: CycleEntry[]` |
| `UserProfile.goals` | `goals: string[]` | `goal: GoalType` (single) |
| `context.md` says AsyncStorage is "To Install" | Already installed and working | ✅ |

**Fix:** Update `context.md` to reflect the actual types.

---

#### 4. Hardcoded fallback name `'Sarah'` in Home screen
**File:** `app/(tabs)/index.tsx` — line 131  
```tsx
<Text>{profile.name || 'Sarah'}</Text>
```
This is a debug placeholder. If a user hasn't entered their name, they see "Sarah" — looks like a bug to end users.  
**Fix:** Use `'there'` or prompt the user to complete their profile.

```tsx
<Text>{profile.name || 'there'}</Text>
// → "Good morning, there"
```

---

#### 5. Pregnancy mode shows hardcoded "Week 4" insight
**File:** `app/(tabs)/index.tsx` — line 108  
```ts
return "Baby is the size of a poppy seed today (Week 4).";
```
This never changes — pregnancy week is never calculated.  
**Fix:** Calculate week from `lastPeriodStart` + 2 weeks (LMP method) and generate dynamic insight.

---

#### 6. Notification button on Home screen is non-functional
**File:** `app/(tabs)/index.tsx` — line 133  
The `TouchableOpacity` has no `onPress` handler — tapping it does nothing.  
**Fix:**
```tsx
<TouchableOpacity onPress={() => router.push('/notifications')} ...>
```

---

#### 7. Ovulation day approximation overly simplistic
**File:** `hooks/use-storage.ts` — line 54  
```ts
const ovulationDay = Math.floor(cycleData.cycleLength / 2); // Approximate
```
For a 28-day cycle this gives Day 14, but true ovulation is typically Day `cycleLength - 14` (luteal phase is fixed at ~14 days).  
**Fix:**
```ts
const ovulationDay = cycleData.cycleLength - 14;
```

---

### 🔵 Improvements

#### 8. No global state / Context — data is re-fetched per screen
Each screen independently calls `useCycleData()` and `useUserProfile()`, causing multiple AsyncStorage reads. For a small app this is fine, but it can cause UI flicker on navigation.  
**Recommendation:** Lift state into a React Context provider in `_layout.tsx` and pass data down.

---

#### 9. `react-native-worklets` included but not used
**File:** `package.json` — line 44  
`react-native-worklets@0.5.1` is listed as a dependency but there are no direct imports of it. It's pulled in by `react-native-reanimated` indirectly — but pinning it manually at a version may conflict.  
**Recommendation:** Remove manual `react-native-worklets` entry and let `react-native-reanimated` manage it.

---

#### 10. Dark mode header style not adaptive
**File:** `app/_layout.tsx` — lines 104–113  
Several stack screen headers always use `Colors.light.background` / `Colors.light.primary`, ignoring dark mode.  
**Fix:** Use the `useColorScheme` hook to select the correct color set.

---

## 📦 Dependencies Audit

| Package | Version | Notes |
|---|---|---|
| `expo` | `~54.0.33` | ✅ Latest stable |
| `react` | `19.1.0` | ✅ React 19 |
| `react-native` | `0.81.5` | ✅ |
| `expo-router` | `~6.0.23` | ✅ |
| `@react-native-async-storage/async-storage` | `2.2.0` | ✅ |
| `react-native-reanimated` | `~4.1.1` | ✅ |
| `react-native-calendars` | `^1.1314.0` | ✅ |
| `react-native-chart-kit` | `^6.12.0` | ⚠️ Peer deps on older RN SVG — verify works with `react-native-svg@^15` |
| `react-native-worklets` | `0.5.1` | ⚠️ Redundant manual pin — remove |
| `expo-crypto` | ❌ Missing | 🔴 Needed for PIN hashing |

---

## 🏗️ Architecture Assessment

```
✅ Good Separation: types / services / hooks / components split cleanly
✅ File-based routing with Expo Router — simple and idiomatic
✅ Dark/light theme token system via constants/theme.ts
✅ Skeleton of useFocusEffect refresh pattern is solid
⚠️ No global state — acceptable for MVP, but will struggle as app scales
⚠️ No error boundaries or crash reporting
❌ No tests of any kind
❌ Sensitive data (PIN) stored insecurely
```

---

## 🚀 Recommended Next Steps (Priority Order)

| Priority | Action |
|---|---|
| 🔴 P0 | Hash the PIN before storing (`expo-crypto`) |
| 🔴 P0 | Remove duplicate `clearAll()` function |
| 🟡 P1 | Fix notification button `onPress` |
| 🟡 P1 | Fix hardcoded `'Sarah'` default name |
| 🟡 P1 | Fix ovulation day formula |
| 🟡 P1 | Fix dark mode header styles |
| 🟡 P1 | Update `context.md` to match real types |
| 🔵 P2 | Add React Context for shared state |
| 🔵 P2 | Implement dynamic pregnancy week calculator |
| 🔵 P2 | Add unit tests for `calculateCycleStatus()` |
| 🔵 P2 | Remove redundant `react-native-worklets` pin |

---

## 📊 Summary Score

| Category | Score |
|---|---|
| Architecture | 7/10 |
| Code Quality | 6/10 |
| Security | 4/10 ← PIN plaintext is the main issue |
| UI/UX | 8/10 |
| Test Coverage | 0/10 |
| Documentation | 5/10 ← context.md is stale |
| **Overall** | **6/10** |

> A solid MVP with a clear, consistent design system. The biggest immediate risk is PIN security. The codebase is clean and well-structured — good foundation to build on.
