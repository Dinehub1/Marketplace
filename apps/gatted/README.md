# GATTED - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Expo CLI
- A Supabase account

### Step 1: Setup Supabase

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Wait for initialization

2. **Run Database Schema**
   - Open SQL Editor in Supabase dashboard
   - Copy contents from `docs/database-schema.sql`
   - Execute the SQL

3. **Configure Authentication**
   - Go to Authentication > Providers
   - Enable **Phone** authentication
   - For testing, use Supabase's default SMS provider
   - For production, configure Twilio

4. **Get API Credentials**
   - Go to Settings > API
   - Copy **Project URL** and **Anon Key**

### Step 2: Configure Environment

1. Create `.env.local` in project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. **Never commit `.env.local` to git!**

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Run the App

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator  
- Scan QR code with Expo Go app for physical device

---

## 📱 Testing the App

### Create Test Data

Run this in Supabase SQL Editor:

```sql
-- Create test society
INSERT INTO public.societies (id, name, city)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'Green Valley Apartments',
  'Bangalore'
);

-- Create test units
INSERT INTO public.units (society_id, unit_number)
VALUES 
  ('123e4567-e89b-12d3-a456-426614174000', 'A-101'),
  ('123e4567-e89b-12d3-a456-426614174000', 'A-102'),
  ('123e4567-e89b-12d3-a456-426614174000', 'B-201');
```

### Test Guard Login

1. Open the app
2. Enter your phone number (format: +91XXXXXXXXXX for India)
3. You'll receive an OTP via SMS
4. Enter the OTP
5. You need a user profile and role assigned in Supabase

### Create Test Guard User

After first login, run this SQL (replace `YOUR_USER_ID` with the ID from `auth.users`):

```sql
-- Create profile
INSERT INTO public.profiles (id, phone, full_name)
VALUES ('YOUR_USER_ID', '+91XXXXXXXXXX', 'Test Guard');

-- Assign guard role
INSERT INTO public.user_roles (user_id, society_id, role)
VALUES (
  'YOUR_USER_ID',
  '123e4567-e89b-12d3-a456-426614174000',
  'guard'
);
```

---

## 🎯 Current Features

### ✅ Completed
- **Auth System**: OTP-based login
- **Role-based routing**: Guard, Resident, Manager, Admin
- **Guard Interface**:
  - Home dashboard with action buttons
  - Expected visitor verification (OTP)
  - Walk-in visitor entry

### 🚧 In Progress
- QR code scanner
- Offline mode
- Resident features
- Manager features

---

## 📁 Project Structure

```
my-app/
├── app/
│   ├── (auth)/          # Login screens
│   ├── (guard)/         # Guard interface
│   ├── (resident)/      # Resident features
│   ├── (manager)/       # Manager features
│   └── (admin)/         # Admin features
├── components/          # Reusable components
├── contexts/            # React contexts
├── stores/              # Zustand stores
├── lib/                 # Utilities & config
├── types/               # TypeScript types
├── api/                 # API helpers
└── docs/                # Documentation
```

---

## 🐛 Troubleshooting

### "Missing environment variables"
- Make sure `.env.local` exists with correct Supabase credentials

### "Invalid OTP" errors
- Check Supabase phone auth is enabled
- Verify SMS provider is configured

### App won't start
```bash
# Clear cache
npm start -- --clear

# Or reset
npx expo start -c
```

### TypeScript errors
```bash
# Type check
npx tsc --noEmit
```

---

## 📖 Next Steps

1. **Setup your Supabase project** (follow `docs/supabase-setup.md`)
2. **Create test data** (use SQL above)
3. **Test guard interface**
4. **Build resident features next**

---

## 🆘 Need Help?

- See `docs/supabase-setup.md` for detailed backend setup
- See `docs/database-schema.sql` for database structure
- Check implementation_plan.md for architecture details
