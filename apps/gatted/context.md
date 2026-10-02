# GATED Project Context

## 1. Project Overview
**Name:** GATTED (Gated Community Management System)
**Slug:** `gatted-2026`
**Bundle Identifier:** `com.dinehub.gatted`
**Description:** A comprehensive mobile application for managing gated communities, facilitating visitor tracking, issue reporting, parcel management, and community announcements.
**Primary Roles:** Admin, Manager, Guard, Resident (Owner/Tenant).

## 2. Technology Stack
- **Frontend/Mobile:** React Native (Expo SDK 54)
- **Router:** Expo Router (File-based routing)
- **Language:** TypeScript
- **Styling:** React Native Paper, React Native SVG
- **State Management:** Zustand
- **Backend/Database:** Supabase (PostgreSQL 17.6)
- **Authentication:** Supabase Auth (OTP-based)
- **Maps/Location:** (Not explicitly seen but likely if address/location needed, otherwise standard inputs)
- **Utilities:** `expo-camera` (QR scanning), `expo-image-picker`, `expo-notifications`

## 3. Folder Structure
```
/
├── app/                  # Expo Router pages (file-based routing)
│   ├── (auth)/           # Login & Authentication screens
│   ├── (guard)/          # Guard-specific interface
│   ├── (resident)/       # Resident-specific interface
│   ├── (manager)/        # Manager-specific interface
│   ├── (admin)/          # Admin-specific interface
│   └── _layout.tsx       # Root layout
├── components/           # Reusable UI components
├── contexts/             # React Contexts (e.g., AuthContext)
├── stores/               # Zustand stores (Global state)
├── lib/                  # Utilities, API helpers, constants
├── supabase/             # Supabase Edge Functions & Config
│   └── functions/        # Edge functions (send-otp, verify-otp)
├── docs/                 # Documentation (Database, Audits)
└── assets/               # Images and static assets
```

## 4. Architecture & Data Flow
- **Pattern:** Mobile-first architecture with role-based routing.
- **Authentication:** Custom OTP flow using Supabase Auth and Edge Functions (`send-otp`, `verify-otp`).
- **Authorization:** Row Level Security (RLS) on Supabase database ensures users only access data relevant to their role and society/unit.
- **Data Access:** Direct Supabase client calls (`supabase.from(...)`) and RPC functions (`supabase.rpc(...)`) for complex logic.

## 5. Database Schema
(See `docs/database.md` for full details including RLS policies and triggers).

### Core Tables
- `profiles`: User details linked to `auth.users`.
- `societies`: Gated communities.
- `blocks`: Buildings within a society.
- `units`: Apartments/flats within blocks.
- `user_roles`: Maps users to societies/units with specific roles.
- `unit_residents`: Family members and tenants.

### Feature Tables
- `visitors`: Visitor tracking (Walk-in, Expected, Guest).
- `issues`: Maintenance requests and complaints.
- `announcements`: Society-wide notices.
- `parcels`: Delivery tracking.
- `notifications`: System notifications.
- `guard_shifts`: Shift management.

## 6. Key Features by Role

### 🛡️ Guard
- **Dashboard:** View visitor stats (Today, Inside).
- **Visitor Check-in:** Verify OTP/QR for pre-approved visitors.
- **Walk-in:** Register unscheduled visitors.
- **Checkout:** Mark visitors as left.
- **Parcels:** Log incoming deliveries and mark as collected.
- **Emergency:** Trigger panic alerts.

### 🏠 Resident (Owner/Tenant)
- **Dashboard:** View upcoming visitors, issues, parcels.
- **Pre-approve Visitor:** Generate OTP/QR for guests/deliveries.
- **Raise Issue:** Report maintenance problems (with photos).
- **My Visitors/Parcels:** History views.

### 👔 Manager
- **Dashboard:** Society-level stats.
- **Announcements:** Post updates for residents.
- **Issue Management:** View and update status of reported issues.

### 🔑 Admin
- **System Management:** Manage societies, users, and roles.
- **Property Management:** Configure blocks and units.

## 7. Environment Variables
Required in `.env` (or `.env.local`):
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous API key.

## 8. Development Commands
- `npm start` / `npx expo start`: Start development server.
- `npm run android` / `npm run ios`: Run on simulators.
- `npm run reset-project`: Reset project state (custom script).
- `npx tsc --noEmit`: Type check.

## 9. Critical Documentation Links
- **Database Reference:** `docs/database.md`
- **Product Audit:** `docs/PRODUCT_AUDIT.md` (Detailed page-by-page breakdown)
- **Manual Testing Guide:** `MANUAL_TESTING_GUIDE.md`
