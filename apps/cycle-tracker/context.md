# Cycle Tracker App - Context Documentation

## Overview
A menstrual cycle tracking mobile app built with **Expo** and **React Native**, featuring a modern purple-themed UI based on Stitch design specifications.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Expo SDK 54** | React Native framework |
| **Expo Router** | File-based navigation |
| **TypeScript** | Type safety |
| **AsyncStorage** | Local data persistence |
| **Manrope Font** | Custom typography via `@expo-google-fonts/manrope` |

---

## Design System

### Colors
| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| Primary | `#5e19e6` | `#8b5cf6` |
| Background | `#ffffff` | `#0f0f1a` |
| Period | `#ec4899` | `#f472b6` |
| Ovulation | `#f59e0b` | `#fbbf24` |
| Fertile | `#10b981` | `#34d399` |
| Luteal | `#8b5cf6` | `#a78bfa` |

### Typography
- **Font Family**: Manrope (400, 500, 600, 700 weights)
- **Border Radius**: 8px base, full for pills

---

## App Screens (11 Total)

### Tab Screens (5)
| Route | File | Description |
|-------|------|-------------|
| `/` | `app/(tabs)/index.tsx` | Today's Cycle Status - home dashboard |
| `/history` | `app/(tabs)/history.tsx` | Symptom History Feed |
| `/insights` | `app/(tabs)/insights.tsx` | Health Insights & Trends |
| `/discover` | `app/(tabs)/discover.tsx` | Educational Library |
| `/profile` | `app/(tabs)/profile.tsx` | Profile & Goals |

### Modal/Stack Screens (6)
| Route | File | Description |
|-------|------|-------------|
| `/onboarding` | `app/onboarding.tsx` | First-time setup with calendar |
| `/pin-lock` | `app/pin-lock.tsx` | PIN security screen |
| `/log-symptoms` | `app/log-symptoms.tsx` | Log flow, mood, symptoms |
| `/notifications` | `app/notifications.tsx` | Reminder settings |
| `/privacy` | `app/privacy.tsx` | Privacy & security settings |
| `/partner-sync` | `app/partner-sync.tsx` | Partner sharing options |

---

## Data Models

### CycleData
```typescript
interface CycleData {
  lastPeriodStart: string;       // ISO date
  cycleLength: number;           // days (default: 28)
  periodLength: number;          // days (default: 5)
  cycles: CycleEntry[];
}

interface CycleEntry {
  id: string;
  date: string;                  // ISO date
  flow?: 'none' | 'light' | 'medium' | 'heavy';
  mood?: string;
  symptoms?: string[];
  notes?: string;
  sleep?: { hours: number; quality: string };
  exercise?: { type: string; duration: number };
}
```

### UserProfile
```typescript
interface UserProfile {
  name: string;
  goals: string[];               // e.g., ['track_period', 'fertility', 'health']
  pinEnabled: boolean;
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
}
```

---

## Local Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `@cycle_tracker/user_profile` | UserProfile | User settings and preferences |
| `@cycle_tracker/cycle_data` | CycleData | All cycle and symptom entries |
| `@cycle_tracker/onboarding_complete` | boolean | First-time setup status |
| `@cycle_tracker/pin` | string | Hashed PIN (if enabled) |

---

## Project Structure
```
my-app/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigator
│   │   ├── index.tsx            # Today screen
│   │   ├── history.tsx          # History screen
│   │   ├── insights.tsx         # Insights screen
│   │   ├── discover.tsx         # Discover screen
│   │   └── profile.tsx          # Profile screen
│   ├── _layout.tsx              # Root layout
│   ├── onboarding.tsx           # Onboarding flow
│   ├── pin-lock.tsx             # PIN lock
│   ├── log-symptoms.tsx         # Log symptoms modal
│   ├── notifications.tsx        # Notifications settings
│   ├── privacy.tsx              # Privacy settings
│   └── partner-sync.tsx         # Partner sync
├── constants/
│   └── theme.ts                 # Design tokens
├── hooks/
│   ├── use-color-scheme.ts      # Theme hook
│   └── use-storage.ts           # Storage hooks (to be created)
├── services/
│   └── storage.ts               # AsyncStorage service (to be created)
└── types/
    └── index.ts                 # TypeScript interfaces (to be created)
```

---

## Dependencies

### Installed
- `expo-router` - Navigation
- `expo-splash-screen` - Splash screen
- `expo-linear-gradient` - Gradient backgrounds
- `@expo-google-fonts/manrope` - Typography
- `@expo/vector-icons` - Icons (Ionicons)

### To Install
- `@react-native-async-storage/async-storage` - Local persistence

---

## Stitch Project Reference
- **Project ID**: `5403729183889706953`
- **Title**: "Cycle Setup Onboarding"
- **Device Type**: Mobile
- **Theme**: Light mode, Manrope font, primary `#5e19e6`
