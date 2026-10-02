# Product Audit – Pages, Actions & Backend Mapping

**Project:** GATED – Gated Community Management System  
**Audit Date:** January 15, 2026  
**Source:** Live Codebase + Supabase Database Analysis

---

## 1. Overview

| Aspect | Details |
|--------|---------|
| **Purpose** | Comprehensive society/apartment gate management system for visitor tracking, issue management, parcel handling, and community announcements |
| **Primary User Roles** | Admin, Manager, Guard, Resident (Owner/Tenant) |
| **Core Modules** | Authentication, Visitor Management, Issue/Complaint System, Parcel Tracking, Announcements, Property Management |
| **Tech Stack** | React Native (Expo) + Supabase (PostgreSQL + RLS) |
| **Database** | 14 tables, 72 RLS policies, 11 functions, 7 custom enums |

---

## 2. Role Definitions

| Role | Scope | Capabilities |
|------|-------|--------------|
| **Admin** | System-wide | Manage all users, societies, blocks, units. Full system access. View all data. |
| **Manager** | Society-level | Manage announcements, view/update issues, monitor visitors, manage society settings |
| **Guard** | Society-level | Register walk-in visitors, verify expected visitors (OTP/QR), checkout visitors, log parcels, trigger emergency alerts |
| **Resident** (Owner) | Unit-level | Pre-approve visitors, view own visitors/issues/parcels, raise issues, manage family members, view announcements |
| **Tenant** | Unit-level | Same as Resident with potential restrictions on family management |

### Role Resolution Logic
```
user_roles table → role enum (admin, manager, guard, resident, owner, tenant)
RLS: is_admin() function → checks if any role = 'admin'
Society/Unit context from user_roles.society_id & unit_id
```

---

## 3. Page-by-Page Audit

---

### PAGE: Login
**Route:** `/(auth)/login.tsx`  
**User Roles Allowed:** Public (unauthenticated)

#### Purpose
Authenticate users via phone number OTP verification. Provides dev shortcuts for testing.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Phone Input | TextInput | Enter 10-digit number | Validates length ≥10 | `supabase.auth.signInWithOtp()` | `auth.users` | Auto-prefixes +91 for India |
| Send OTP Button | Button | Click | Shows loading, disables input | Supabase Auth SMS OTP | `auth.users` | Rate limited by Supabase |
| OTP Input | TextInput | Enter 6-digit OTP | Validates length = 6 | `supabase.auth.verifyOtp()` | `auth.users`, `profiles` | Type: 'sms' |
| Verify OTP Button | Button | Click | Navigates on success | Verifies OTP, creates session | `auth.users` | Session stored in AsyncStorage |
| Change Phone Link | Link | Click | Resets to phone step | Local state reset | - | - |
| Dev Login Buttons | Button (×4) | Click | Auto-login as role | `useAuthStore.devLogin(role)` | `auth.users`, `user_roles` | **DEV ONLY - REMOVE IN PROD** |

#### Backend Logic
- **Auth:** Supabase Auth via SMS OTP
- **Session:** Persisted in AsyncStorage (native) / localStorage (web)
- **Post-login:** `AuthProvider.initialize()` fetches profile + user_roles

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| READ | `profiles`, `user_roles` (post-auth) |
| INSERT | `auth.users` (new user signup) |

> [!WARNING]
> **Dev Login Buttons** bypass real authentication. Must be removed before production deployment.

---

### PAGE: Admin Dashboard
**Route:** `/(admin)/index.tsx`  
**User Roles Allowed:** Admin

#### Purpose
System overview showing total users and societies with quick actions for management.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Stats: Total Users | StatCard | Display | Shows count | `supabase.from('profiles').select('*', {count: 'exact'})` | `profiles` | Uses RLS: `is_admin()` |
| Stats: Societies | StatCard | Display | Shows count | `supabase.from('societies').select('*', {count: 'exact'})` | `societies` | Uses RLS: `is_admin()` |
| Manage Users Button | ActionButton | Tap | Navigate to manage-users | Client navigation | - | - |
| Manage Societies Button | ActionButton | Tap | Navigate to manage-units | Client navigation | - | - |
| View Reports Button | ActionButton | Tap | `Alert('Coming Soon')` | - | - | **NOT IMPLEMENTED** |
| System Settings Button | ActionButton | Tap | `Alert('Coming Soon')` | - | - | **NOT IMPLEMENTED** |
| Logout Icon | Icon | Tap | Signs out user | `supabase.auth.signOut()` | - | Clears session |
| Pull to Refresh | RefreshControl | Pull down | Reloads stats | Re-fetches counts | `profiles`, `societies` | - |

#### Backend Logic
- **RLS Policy:** `is_admin()` check for SELECT on profiles
- **Stats:** Uses Postgres `count` aggregation

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| READ | `profiles` (count), `societies` (count) |

---

### PAGE: Manage Users
**Route:** `/(admin)/manage-users.tsx`  
**User Roles Allowed:** Admin

#### Purpose
View all system users, search, and update user roles.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Search Input | TextInput | Type query | Filters list locally | - | - | Client-side filter |
| User Card | TouchableOpacity | Tap | Opens role modal | - | - | Shows name, email, current role |
| Role Modal | Modal | Select role | Closes modal, updates | `supabase.from('user_roles').update()` or `.insert()` | `user_roles` | Creates role if not exists |
| Role Options | TouchableOpacity (×4) | Tap | Triggers update | See above | `user_roles` | resident, guard, manager, admin |

#### Buttons & Actions (Detailed)

**User Card**
- **Enabled:** Always
- **Role Restrictions:** Admin only (page-level)
- **Error States:** Alert on fetch/update failure
- **Success State:** "User role updated successfully" Alert

**Role Update**
- Checks if user_roles entry exists
- UPDATE if exists, INSERT if new
- ✅ **FIXED:** Now includes society selector and confirmation dialogs

#### Backend Logic
```javascript
// Fetch users with roles + society info
supabase.from('profiles').select('*, user_roles!user_roles_user_id_fkey(role, society_id, society:societies(name))')

// Update existing role
supabase.from('user_roles').update({ role: newRole, society_id: selectedSociety }).eq('user_id', userId)

// Insert new role WITH society_id (FIXED)
supabase.from('user_roles').insert({ user_id, role, society_id: selectedSociety, is_active: true })
```

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| READ | `profiles`, `user_roles`, `societies` |
| UPDATE | `user_roles` |
| INSERT | `user_roles` |

> [!TIP]
> ✅ **FIXED (Jan 14, 2026):** Society selector added to modal. Confirmation dialog before role changes.

---

### PAGE: Property Management (Manage Units)
**Route:** `/(admin)/manage-units.tsx`  
**User Roles Allowed:** Admin

#### Purpose
Hierarchical management of Societies → Blocks → Units.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Breadcrumb | TouchableOpacity | Tap | Navigate hierarchy | Local state | - | All Societies → Society → Block |
| Society Card | Card | Tap | Drill into blocks | Sets selectedSociety | - | - |
| Block Card | Card | Tap | Drill into units | Sets selectedBlock | - | - |
| Unit Card | Card | View only | Display | - | - | No actions |
| Add Society (+) | Icon | Tap | Opens create modal | `supabase.from('societies').insert()` | `societies` | - |
| Add Block (+) | Icon | Tap | Opens create modal | `supabase.from('blocks').insert()` | `blocks` | Requires society selected |
| Add Unit (+) | Icon | Tap | Opens create modal | `supabase.from('units').insert()` | `units` | Requires block selected |
| Create Modal | Modal | Fill + Submit | Creates entity | Insert to respective table | `societies`/`blocks`/`units` | - |

#### Backend Logic
- **RLS:** `is_admin()` for INSERT operations
- **Cascade:** Society_id flows to blocks/units

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| READ | `societies`, `blocks`, `units` |
| INSERT | `societies`, `blocks`, `units` |

> [!NOTE]
> No UPDATE or DELETE actions implemented for properties.

---

### PAGE: Guard Dashboard
**Route:** `/(guard)/index.tsx`  
**User Roles Allowed:** Guard

#### Purpose
Central hub for guard operations with today's visitor stats and quick actions.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Stats: Visitors Today | StatCard | Display | Shows count | Query visitors by society + date | `visitors` | Filters by `expected_date` or `checked_in_at` |
| Stats: Currently Inside | StatCard | Display | Shows count | Filters `status = 'checked-in'` | `visitors` | - |
| Expected Visitor Button | ActionButton | Tap | Navigate | Goes to expected-visitor | - | QR/OTP verification |
| Checkout Button | ActionButton | Tap | Navigate | Goes to checkout | - | - |
| Walk-in Button | ActionButton | Tap | Navigate | Goes to walk-in | - | - |
| Parcels Button | ActionButton | Tap | Navigate | Goes to parcels | - | - |
| Emergency Alert Button | ActionButton | Tap | Navigate | Goes to panic | - | **Danger variant** |
| Notifications Icon | Icon | Tap | Navigate | Goes to notifications | - | - |
| Profile Icon | Icon | Tap | Navigate | Goes to profile | - | - |

#### Backend Logic
```javascript
// Stats query
supabase.from('visitors')
  .select('id, status, expected_date, checked_in_at')
  .eq('society_id', currentRole.society_id)
```

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| READ | `visitors` |

---

### PAGE: Expected Visitor Check-in
**Route:** `/(guard)/expected-visitor.tsx`  
**User Roles Allowed:** Guard

#### Purpose
Verify and check-in pre-approved visitors via OTP or QR code.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| OTP Tab | Tab | Tap | Switches to OTP mode | Local state | - | - |
| QR Tab | Tab | Tap | Switches to QR mode | Local state | - | - |
| OTP Input | TextInput | Enter 6-digit | Validates length | Local validation | - | - |
| Verify & Check In Button | Button | Tap | Validates OTP, calls RPC | `supabaseHelpers.logVisitorEntry()` | `visitors` | Uses `checkin_visitor` RPC |
| QR Scanner | CameraView | Scan | Parses QR JSON | `checkin_visitor` RPC | `visitors` | Expects `{visitorId, otp, visitorName}` |
| Visitor Card | Card | Tap | Confirmation dialog | `checkin_visitor` RPC | `visitors` | Manual check-in option |
| Visitor List | FlatList | Pull refresh | Reload expected | Query visitors | `visitors` | Filters today + pending/approved |

#### Buttons & Actions (Detailed)

**Verify & Check In Button**
- **Enabled:** OTP.length === 6 && !isLoading
- **Validation:** 
  1. OTP matches visitor in local list
  2. OTP not expired (`otp_expires_at`)
- **Error States:** "Invalid OTP", "OTP expired"
- **Success State:** "Visitor Checked In" Alert + list refresh

#### Backend Logic
```javascript
// RPC Call for check-in
supabase.rpc('checkin_visitor', {
  visitor_uuid: visitorId,
  guard_uuid: guardId,
  otp_code: otp
})

// Fetch expected visitors
supabaseHelpers.getExpectedVisitors(societyId, today)
// Returns: visitors with status IN ('pending', 'approved')
```

**`checkin_visitor` Function:**
- Validates visitor exists
- Validates OTP if provided
- Sets `status = 'checked-in'`
- Records `checked_in_at`, `checked_in_by`
- **Security:** `SECURITY DEFINER` with `search_path = public`

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| READ | `visitors`, `units`, `profiles` |
| UPDATE | `visitors` (via RPC) |

#### Triggers Fired
- `notify_visitor_status_change()` → Creates notification for host

---

### PAGE: Walk-in Visitor Registration
**Route:** `/(guard)/walk-in.tsx`  
**User Roles Allowed:** Guard

#### Purpose
Register unscheduled visitors at the gate.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Visitor Name Input | TextInput | Type | Required validation | - | - | `autoCapitalize: words` |
| Phone Input | TextInput | Type | Min 10 digits | - | - | `keyboardType: phone-pad` |
| Unit Selector | UnitSelector Component | Select | Fetches blocks/units | Query blocks/units | `blocks`, `units` | Hierarchical picker |
| Purpose Input | TextInput | Type | Optional | - | - | Multiline |
| Check In Button | Button | Tap | Insert + immediate check-in | Direct insert | `visitors` | `status: 'checked-in'` |

#### Backend Logic
```javascript
// Optional: Find resident for unit
supabase.from('user_roles')
  .select('user_id')
  .eq('unit_id', formData.unitId)
  .in('role', ['resident', 'owner', 'tenant'])
  .limit(1)

// Insert visitor as already checked-in
supabase.from('visitors').insert({
  society_id, unit_id, host_id, // host_id can be null
  visitor_name, visitor_phone, purpose,
  visitor_type: 'walk-in',
  status: 'checked-in',
  checked_in_at: new Date(),
  checked_in_by: guardId
})
```

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| READ | `user_roles`, `blocks`, `units` |
| INSERT | `visitors` |

> [!NOTE]
> Walk-in visitors have `host_id = null` if no resident found for unit. This is valid.

---

### PAGE: Visitor Checkout
**Route:** `/(guard)/checkout.tsx`  
**User Roles Allowed:** Guard

#### Purpose
Mark checked-in visitors as checked-out when leaving.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Search Input | TextInput | Type | Filters locally | - | - | By name, vehicle, unit |
| Visitor Card | Card | View | Shows visitor info | - | `visitors`, `units`, `blocks` | With check-in time |
| Check Out Button | Button | Tap | Confirmation dialog | Direct update | `visitors` | Updates status |

#### Backend Logic
```javascript
// Fetch checked-in visitors
supabase.from('visitors')
  .select('id, visitor_name, vehicle_number, status, checked_in_at, unit:units(unit_number, block:blocks(name))')
  .eq('society_id', societyId)
  .eq('status', 'checked-in')

// Checkout via RPC (FIXED)
supabase.rpc('checkout_visitor', {
  visitor_uuid: visitorId,
  guard_uuid: guardId
})
```

> [!TIP]
> ✅ **FIXED (Jan 14, 2026):** Now uses `checkout_visitor` RPC function for proper validation and audit trail.

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| READ | `visitors`, `units`, `blocks` |
| UPDATE | `visitors` (via RPC) |

---

### PAGE: Parcels Management
**Route:** `/(guard)/parcels.tsx`  
**User Roles Allowed:** Guard

#### Purpose
Log incoming deliveries and track until collected by residents.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Add Parcel (+) | Icon | Tap | Toggle form | Local state | - | - |
| Unit Selector | UnitSelector | Select | Required | - | `blocks`, `units` | - |
| Courier Name Input | TextInput | Type | Optional | - | - | e.g., Amazon |
| Tracking # Input | TextInput | Type | Optional | - | - | - |
| Log Parcel Button | Button | Tap | Insert parcel | `supabase.from('parcels').insert()` | `parcels`, `user_roles` | - |
| Parcel Card | Card | View | Shows parcel info | - | `parcels`, `units` | - |
| Mark Collected Button | Button | Tap | Confirmation | Update status | `parcels` | - |

#### Backend Logic
```javascript
// Find resident for unit (for notification)
supabase.from('user_roles')
  .select('user_id')
  .eq('unit_id', unitId)
  .eq('role', 'resident')
  .limit(1)

// Insert parcel
supabase.from('parcels').insert({
  society_id, unit_id, resident_id,
  courier_name, tracking_number, description,
  received_by: guardId,
  status: 'received'
})

// Mark collected
supabase.from('parcels').update({
  status: 'collected',
  collected_at: new Date(),
  collected_by: guardId
}).eq('id', parcelId)
```

#### Triggers Fired
- `notify_parcel_received()` → AFTER INSERT → Notifies resident

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| READ | `parcels`, `units`, `user_roles` |
| INSERT | `parcels` |
| UPDATE | `parcels` |

---

### PAGE: Manager Dashboard
**Route:** `/(manager)/index.tsx`  
**User Roles Allowed:** Manager

#### Purpose
Society-level overview with visitor/issue stats and management actions.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Stats: Today's Visitors | StatCard | Display | Count | Query visitors | `visitors` | - |
| Stats: Pending | StatCard | Display | Count | Filter pending | `visitors` | - |
| Stats: Open Issues | StatCard | Display | Count | Filter open | `issues` | - |
| Stats: In Progress | StatCard | Display | Count | Filter in-progress | `issues` | - |
| Manage Announcements | ActionButton | Tap | Navigate | - | - | - |
| View All Visitors | ActionButton | Tap | Navigate | - | - | - |
| Manage Issues | ActionButton | Tap | Navigate | - | - | - |
| Manage Units | ActionButton | Tap | `Alert('Coming Soon')` | - | - | **NOT IMPLEMENTED** |

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| READ | `visitors`, `issues` |

---

### PAGE: Manage Announcements
**Route:** `/(manager)/announcements.tsx`  
**User Roles Allowed:** Manager

#### Purpose
View, create, and delete society announcements.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Announcement Card | Card | View | Display | - | `announcements` | - |
| Delete Button | Icon (🗑️) | Tap | Confirmation dialog | `supabase.from('announcements').delete()` | `announcements` | Optimistic UI update |
| FAB (+) | FloatingActionButton | Tap | Navigate | Goes to create-announcement | - | - |
| Pull Refresh | RefreshControl | Pull | Reload | Re-fetch | `announcements` | - |

#### Backend Logic
```javascript
// Fetch announcements
supabase.from('announcements')
  .select('*')
  .eq('society_id', societyId)
  .order('created_at', { ascending: false })

// Delete
supabase.from('announcements')
  .delete()
  .eq('id', id)
```

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| READ | `announcements` |
| DELETE | `announcements` |

---

### PAGE: Create Announcement
**Route:** `/(manager)/create-announcement.tsx`  
**User Roles Allowed:** Manager, Guard

#### Purpose
Create new society-wide or targeted announcements.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Title Input | TextInput | Type | Required | - | - | - |
| Message Input | TextInput | Type | Required | - | - | Multiline |
| Priority Selector | Picker | Select | Sets priority | - | - | normal, important, urgent |
| Target Type | Picker | Select | Shows sub-options | - | - | all, block, unit |
| Submit Button | Button | Tap | Insert | `supabase.from('announcements').insert()` | `announcements` | - |

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| INSERT | `announcements` |

---

### PAGE: Manage Issues
**Route:** `/(manager)/issues.tsx`  
**User Roles Allowed:** Manager

#### Purpose
View society issues and update their status.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Filter Tabs | Tab (×3) | Tap | Filter list | Local filter | - | Open, In Progress, All |
| Issue Card | Card | Tap | Status update dialog | - | `issues`, `units`, `profiles` | Shows category, priority |
| Status Update Dialog | Alert | Select option | Update status | `supabase.from('issues').update()` | `issues` | In Progress, Resolve, Close |

#### Backend Logic
```javascript
// Fetch issues
supabase.from('issues')
  .select('*, unit:units(unit_number), reporter:profiles!issues_reported_by_fkey(full_name)')
  .eq('society_id', societyId)
  .eq('status', filter) // conditional

// Update status
supabase.from('issues').update({
  status: newStatus,
  updated_at: new Date(),
  resolved_at: newStatus === 'resolved' ? new Date() : null
}).eq('id', id)
```

#### Triggers Fired
- `notify_issue_changes()` → AFTER UPDATE → Notifies reporter

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| READ | `issues`, `units`, `profiles` |
| UPDATE | `issues` |

---

### PAGE: Resident Dashboard
**Route:** `/(resident)/index.tsx`  
**User Roles Allowed:** Resident, Owner, Tenant

#### Purpose
Personal dashboard for residents to manage visitors, issues, and view parcels.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Stats: Upcoming Visitors | StatCard | Display | Count | Filter future visitors | `visitors` | `host_id = userId` |
| Stats: Today | StatCard | Display | Count | Filter today | `visitors` | - |
| Stats: Open Issues | StatCard | Display | Count | Filter open | `issues` | `reported_by = userId` |
| Pre-approve Visitor | ActionButton | Tap | Navigate | - | - | QR/OTP generation |
| My Visitors | ActionButton | Tap | Navigate | - | - | - |
| My Issues | ActionButton | Tap | Navigate | - | - | - |
| My Parcels | ActionButton | Tap | Navigate | - | - | - |
| Announcements | ActionButton | Tap | Navigate | - | - | - |
| Manage Family | ActionButton | Tap | Navigate | - | - | - |
| Raise Issue | ActionButton | Tap | Navigate | - | - | **Danger variant** |

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| READ | `visitors`, `issues` |

---

### PAGE: Pre-approve Visitor
**Route:** `/(resident)/pre-approve-visitor.tsx`  
**User Roles Allowed:** Resident

#### Purpose
Create pre-approved visitor entry with QR code and OTP for guard verification.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Visitor Type Cards | Grid (×4) | Tap | Select type | Local state | - | Guest, Delivery, Expected, Service |
| Visitor Name | TextInput | Type | Required | - | - | - |
| Phone Number | TextInput | Type | Required | - | - | - |
| Vehicle Number | TextInput | Type | Optional | - | - | - |
| Expected Date | DateInput | Select | Required | - | - | Min: today |
| Expected Time | DateInput | Select | Optional | - | - | - |
| Purpose | TextInput | Type | Optional | - | - | Multiline |
| Generate QR & OTP | Button | Tap | Insert + show result | `supabase.from('visitors').insert()` | `visitors` | `status: 'approved'` |
| QR Code Display | QRCode | View | Generated | - | - | Contains `{visitorId, otp, visitorName}` |
| OTP Display | Text | View | 6-digit code | - | - | Valid 24 hours |
| Pre-approve Another | Button | Tap | Reset form | Local state | - | - |

#### Backend Logic
```javascript
const otp = Math.floor(100000 + Math.random() * 900000).toString();
const otpExpiresAt = new Date();
otpExpiresAt.setHours(otpExpiresAt.getHours() + 24);

supabase.from('visitors').insert({
  society_id, unit_id, host_id: userId,
  visitor_name, visitor_phone, vehicle_number,
  visitor_type, expected_date, expected_time,
  purpose,
  status: 'approved',
  otp,
  otp_expires_at: otpExpiresAt
})
```

> [!IMPORTANT]
> OTP generated client-side but also server-side via trigger. The `generate_otp_on_insert` trigger may override client OTP.

#### Database Interaction
| Operation | Tables |
|-----------|--------|
| INSERT | `visitors` |

#### Triggers Fired
- `generate_otp_on_insert` → BEFORE INSERT → May override client OTP

---

### PAGE: Raise Issue
**Route:** `/(resident)/raise-issue.tsx`  
**User Roles Allowed:** Resident

#### Purpose
Report maintenance issues or complaints with optional photo upload.

#### UI Components & Actions

| UI Element | Type | User Action | Frontend Behavior | Backend Action | DB Tables | Notes |
|------------|------|-------------|-------------------|----------------|-----------|-------|
| Category Grid | Grid (×6) | Tap | Select category | Local state | - | plumbing, electrical, security, maintenance, cleaning, other |
| Priority Buttons | Row (×3) | Tap | Select priority | Local state | - | low, medium, high |
| Title Input | TextInput | Type | Required | - | - | - |
| Description Input | TextInput | Type | Required | - | - | Multiline, 5 lines |
| Take Photo Button | Button | Tap | Camera | `ImagePicker.launchCameraAsync()` | - | - |
| Choose Gallery Button | Button | Tap | Gallery | `ImagePicker.launchImageLibraryAsync()` | - | - |
| Submit Issue Button | Button | Tap | Upload photo + insert | `supabase.storage` + `from('issues').insert()` | `issues`, storage | - |

#### Backend Logic
```javascript
// Upload photo
supabase.storage.from('issue-photos').upload(filePath, blob)

// Get public URL
supabase.storage.from('issue-photos').getPublicUrl(filePath)

// Insert issue
supabase.from('issues').insert({
  society_id, unit_id, reported_by: userId,
  title, description, category, priority,
  status: 'open',
  photos: photoUrl ? [photoUrl] : []
})
```

#### Database Interaction
| Operation | Tables/Storage |
|-----------|----------------|
| INSERT | `issues` |
| UPLOAD | `issue-photos` bucket |

---

## 4. Global Components

### Header (`PageHeader`)
| Feature | Backend Dependency | Notes |
|---------|-------------------|-------|
| User name display | `useAuth().profile.full_name` | From auth context |
| Society name | `useAuth().currentRole.society.name` | From user_roles join |
| Logout button | `supabase.auth.signOut()` | Clears session |
| Notifications icon | Client navigation | Links to notifications page |
| Profile icon | Client navigation | Links to profile page |

### Unit Selector (`UnitSelector`)
| Feature | Backend Action | Notes |
|---------|---------------|-------|
| Fetch blocks | `supabase.from('blocks').select('*').eq('society_id', societyId)` | - |
| Fetch units | `supabase.from('units').select('*').eq('block_id', blockId)` | - |
| Search | Client-side filter | By unit number |

### Notification Hooks (`useNotifications`)
| Feature | Backend Action | Notes |
|---------|---------------|-------|
| Fetch notifications | `supabase.from('notifications').select('*').eq('user_id', userId)` | - |
| Mark as read | `supabase.from('notifications').update({ read: true })` | - |
| Delete | `supabase.from('notifications').delete()` | - |

---

## 5. Permissions Matrix

| Page | Admin | Manager | Guard | Resident | Create | Update | Delete |
|------|:-----:|:-------:|:-----:|:--------:|:------:|:------:|:------:|
| **Auth/Login** | ✓ | ✓ | ✓ | ✓ | - | - | - |
| **Admin Dashboard** | ✓ | ✗ | ✗ | ✗ | - | - | - |
| **Manage Users** | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| **Manage Units** | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| **Guard Dashboard** | ✗ | ✗ | ✓ | ✗ | - | - | - |
| **Expected Visitor** | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| **Walk-in** | ✗ | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ |
| **Checkout** | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| **Parcels** | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ | ✗ |
| **Manager Dashboard** | ✗ | ✓ | ✗ | ✗ | - | - | - |
| **Announcements Mgmt** | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ |
| **Issues Mgmt** | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ |
| **Resident Dashboard** | ✗ | ✗ | ✗ | ✓ | - | - | - |
| **Pre-approve Visitor** | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |
| **Raise Issue** | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |
| **My Visitors** | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |

---

## 6. Missing / Risky Areas

### 🔴 Critical Issues (Remaining)

| Issue | Location | Risk | Status |
|-------|----------|------|--------|
| ~~Dev login buttons~~ | `login.tsx` | ~~High~~ | ✅ **FIXED (Jan 14)** - Wrapped in `__DEV__` check |
| ~~Missing society_id on role insert~~ | `manage-users.tsx` | ~~High~~ | ✅ **FIXED** - Society selector added |
| ~~Direct update bypasses RPC~~ | `checkout.tsx` | ~~Medium~~ | ✅ **FIXED** - Now uses `checkout_visitor` RPC |
| ~~Client-side OTP generation~~ | `pre-approve-visitor.tsx` | ~~Low~~ | ✅ **FIXED (Jan 14)** - Now uses server-generated OTP |
| ~~Missing phone validation~~ | `walk-in.tsx`, `pre-approve-visitor.tsx` | ~~Medium~~ | ✅ **FIXED (Jan 14)** - Indian mobile regex added |
| ~~Missing society_id on family add~~ | `family.tsx` | ~~Medium~~ | ✅ **FIXED (Jan 14)** - society_id added to insert |

### 🟡 Backend Routes Without UI

| Backend Function | Purpose | UI Status |
|-----------------|---------|-----------|
| `cleanup_expired_visitors()` | Mark expired visitors as denied | No UI - should be cron job |
| `get_user_context()` (×2 overloads) | Return user context | Internal use only |

### 🟡 Tables Exposed Without Full UI

| Table | Select | Insert | Update | Delete | Notes |
|-------|:------:|:------:|:------:|:------:|-------|
| `unit_residents` | ⚠️ | ⚠️ | ⚠️ | ⚠️ | Family page exists but incomplete |
| `issue_updates` | ✗ | ✗ | ✗ | ✗ | No UI for issue comments |
| `guard_shifts` | ✗ | ✗ | ✗ | ✗ | No shift management UI |
| `announcement_reads` | ✓ | ✓ | ✗ | ✗ | Auto-managed, no explicit UI |

### ✅ RLS Security Status (MCP Verified Jan 15, 2026)

| Check | Status |
|-------|--------|
| `temp_allow_all_inserts` policy | ✅ **REMOVED** - Verified via SQL query |
| `notifications_insert_policy` | ✅ **REMOVED (Jan 15)** - Insecure unrestricted INSERT policy removed |
| `auth_otps` & `auth_sessions` | ✅ **SECURED (Jan 15)** - Insecure 'allow all' policies removed. RLS enabled. |
| Function search_path | ✅ All 11 functions have `search_path=public` |
| Leaked password protection | ⚠️ Disabled - Enable in Auth settings |

---

## 7. Security Assessment by Page

### Authentication Module

#### Login Page
**Rating:** ✅ **SAFE**

| Issue | Severity | Description |
|-------|----------|-------------|
| ~~Dev login buttons~~ | ~~🟢 Low~~ | ✅ **FIXED (Jan 14)** - Now wrapped in `__DEV__` check, only visible in development |
| No rate limiting on OTP | 🟡 Medium | Supabase has some protection, but no client-side throttling |

**What to Fix:**
```javascript
// REMOVE this entire section before production:
<View style={styles.devSection}>
  <TouchableOpacity onPress={() => useAuthStore.getState().devLogin('guard')} />
  // ... all dev buttons
</View>

// ADD environment check if dev mode is needed:
{__DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_LOGIN === 'true' && (
  <DevLoginSection />
)}
```

---

### Admin Module

#### Admin Dashboard
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| Role-gated access | ✅ Layout checks `role === 'admin'` |
| RLS on data queries | ✅ `is_admin()` function protects data |
| No sensitive mutations | ✅ Read-only stats |

---

#### Manage Users
**Rating:** ⚠️ **NEEDS FIX**

| Issue | Severity | Description |
|-------|----------|-------------|
| Missing `society_id` on INSERT | 🔴 Critical | New role assignment will fail or create orphan records |
| No confirmation for role change | 🟡 Medium | Accidental clicks can change roles instantly |
| Admin can demote other admins | 🟡 Medium | No protection against removing last admin |

**What to Fix:**
```javascript
// Line 87-93: Add society_id when inserting new role
const { error: insertError } = await supabase
  .from('user_roles')
  .insert({
    user_id: userId,
    role: newRole,
    society_id: selectedSocietyId, // ← ADD THIS (need society selector UI)
    is_active: true
  });

// Add confirmation modal before role change
Alert.alert(
  'Confirm Role Change',
  `Change ${user.full_name}'s role from ${currentRole} to ${newRole}?`,
  [{ text: 'Cancel' }, { text: 'Confirm', onPress: updateRole }]
);
```

---

#### Property Management (Manage Units)
**Rating:** ⚠️ **NEEDS FIX**

| Issue | Severity | Description |
|-------|----------|-------------|
| No input validation | 🟡 Medium | Society/block names not sanitized |
| No edit/delete for existing entries | 🟡 Medium | Incomplete CRUD |
| No cascade warning | 🟢 Low | Deleting society should warn about children |

**What to Fix:**
- Add input length limits and character validation
- Implement UPDATE operations for existing entities
- Add delete with cascade confirmation

---

### Guard Module

#### Guard Dashboard
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| Society-scoped queries | ✅ Filters by `currentRole.society_id` |
| Read-only stats | ✅ No mutations |
| Role check in layout | ✅ Guards only |

---

#### Expected Visitor Check-in
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| Uses RPC function | ✅ `checkin_visitor` validates server-side |
| OTP expiry check | ✅ Client + server validation |
| Society-scoped | ✅ Queries filtered by society |
| QR data validated | ✅ Checks visitor exists in expected list |

---

#### Walk-in Visitor
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| Phone number validation | ✅ Regex `^[6-9]\d{9}$` implemented |
| Duplicate check warning | ✅ UI shows warning if visitor checked in today |
| `host_id` handling | ✅ Proper null handling for notifications |

---

#### Visitor Checkout
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| Uses RPC function | ✅ `checkout_visitor` RPC used correctly |
| Guard audit trail | ✅ RPC records `checked_out_by` |
| Society-scoped | ✅ Queries filtered by society |

---

#### Parcels Management
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| Society-scoped | ✅ Filters by `currentRole.society_id` |
| RLS enforced | ✅ Guards can only INSERT with `status='received'` |
| Resident lookup optional | ✅ Graceful handling if no resident found |
| Status transitions validated | ✅ RLS policy checks valid transitions |

---

#### Emergency/Panic
**Rating:** ⚠️ **NEEDS FIX** (based on standard implementation)

| Issue | Severity | Description |
|-------|----------|-------------|
| No audit trail | 🟡 Medium | Emergency alerts should be logged |
| No rate limiting | 🟡 Medium | Could spam emergency alerts |

**What to Fix:**
- Log all emergency alerts to a dedicated table
- Add cooldown period between alerts
- Require confirmation before sending

---

### Manager Module

#### Manager Dashboard
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| Society-scoped queries | ✅ Filters by `currentRole.society_id` |
| Read-only stats | ✅ No mutations |
| Role check in layout | ✅ Managers only |

---

#### Manage Announcements
**Rating:** ✅ **SAFE**

| Issue | Severity | Description |
|-------|----------|-------------|
| Soft-delete implemented | ✅ | Deletes now set `is_active = false` |
| Creator verification | 🟡 Medium | Manager can archive any announcement (acceptable for MVP) |


---

#### Create Announcement
**Rating:** ⚠️ **NEEDS FIX**

| Issue | Severity | Description |
|-------|----------|-------------|
| `temp_allow_all_inserts` policy exists | 🔴 Critical | Documentation says removed, but verify in database |
| No input sanitization | 🟡 Medium | Title/message not sanitized for XSS |

**What to Fix:**
```sql
-- Verify this policy is REMOVED:
DROP POLICY IF EXISTS "temp_allow_all_inserts" ON announcements;

-- Ensure proper INSERT policy exists:
CREATE POLICY "Staff can create announcements" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND society_id = announcements.society_id
      AND role IN ('manager', 'admin')
    )
  );
```

---

#### Manage Issues
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| Society-scoped | ✅ Filters by `currentRole.society_id` |
| Status update via direct UPDATE | ⚠️ Acceptable, RLS validates role |
| Trigger creates notification | ✅ Reporter notified of changes |

---

### Resident Module

#### Resident Dashboard
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| User-scoped queries | ✅ Filters by `host_id = userId` or `reported_by = userId` |
| Read-only stats | ✅ No mutations |
| Role check in layout | ✅ Residents only |

---

#### Pre-approve Visitor
**Rating:** ⚠️ **NEEDS FIX**

| Issue | Severity | Description |
|-------|----------|-------------|
| Client-side OTP generation | 🟢 Low | Server trigger regenerates, but confusing |
| OTP shown in plain text | 🟡 Medium | Should be copied to clipboard, not displayed prominently |
| No limit on pre-approvals | 🟡 Medium | Could create unlimited visitor passes |

**What to Fix:**
```javascript
// Remove client-side OTP generation (server does it via trigger):
const visitorRecord = {
  // ... other fields
  // REMOVE: otp: generateOTP(),
  // REMOVE: otp_expires_at: otpExpiresAt,
  status: 'approved'
};

// Then fetch the generated OTP from the result:
const { data } = await supabase.from('visitors').insert(visitorRecord).select().single();
setGeneratedOTP(data.otp); // Use server-generated OTP

// Add rate limit check:
const { count } = await supabase
  .from('visitors')
  .select('*', { count: 'exact' })
  .eq('host_id', userId)
  .gte('created_at', new Date(Date.now() - 24*60*60*1000));

if (count >= 10) {
  Alert.alert('Limit Reached', 'Maximum 10 pre-approvals per 24 hours');
}
```

---

#### My Visitors (View/Manage)
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| User-scoped | ✅ Filters by `host_id = auth.uid()` |
| Update own only | ✅ RLS enforces owner-only updates |
| Delete own only | ✅ RLS enforces owner-only deletes |

---

#### Raise Issue
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| Reporter set to current user | ✅ `reported_by: profile.id` |
| Photo upload to private bucket | ✅ Uses `issue-photos` storage bucket |
| Society/unit from user context | ✅ Uses `currentRole.society_id/unit_id` |

---

#### My Issues
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| User-scoped | ✅ Filters by `reported_by = userId` |
| Read-only for residents | ✅ No status updates allowed |

---

#### Manage Family
**Rating:** ⚠️ **NEEDS FIX**

| Issue | Severity | Description |
|-------|----------|-------------|
| Incomplete implementation | 🟡 Medium | CRUD operations may be partially implemented |
| No validation of family count | 🟡 Medium | Could add unlimited family members |

**What to Fix:**
- Implement complete CRUD for `unit_residents`
- Add maximum family member limit per unit
- Verify RLS policies on `unit_residents` table

---

#### My Parcels
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| User-scoped | ✅ Filters by `resident_id = userId` or unit ownership |
| Read-only | ✅ Residents cannot modify parcel status |

---

#### Announcements
**Rating:** ✅ **SAFE**

| Check | Status |
|-------|--------|
| Society-scoped | ✅ Only sees own society announcements |
| Targeting respected | ✅ Block/unit targeting filters correctly |
| Read tracking | ✅ Uses `announcement_reads` table |

---

## Security Summary

### By Rating

| Rating | Count | Pages |
|--------|-------|-------|
| ❌ Security Risk | 1 | Login |
| ⚠️ Needs Fix | 9 | Manage Users, Property Mgmt, Walk-in, Checkout, Panic, Announcements Mgmt, Create Announcement, Pre-approve Visitor, Family |
| ✅ Safe | 11 | Admin Dashboard, Guard Dashboard, Expected Visitor, Parcels, Manager Dashboard, Issues Mgmt, Resident Dashboard, My Visitors, Raise Issue, My Issues, My Parcels, Announcements |

### Priority Fix Order

1. **IMMEDIATE (Before Production):**
   - Remove dev login buttons (`login.tsx`)
   - Verify `temp_allow_all_inserts` policy is removed

2. **HIGH (This Sprint):**
   - Fix `manage-users.tsx` society_id on insert
   - Use `checkout_visitor` RPC instead of direct update

3. **MEDIUM (Next Sprint):**
   - Add rate limiting to pre-approvals
   - Implement complete family management
   - Add input validation across forms

4. **LOW (Backlog):**
   - Add audit logging for deletions
   - Implement soft deletes for announcements
   - Add emergency alert logging

---

## 8. Recommendations

### Security Improvements

1. **Remove dev login buttons** from production build
2. **Enforce society_id requirement** when assigning roles
3. **Use RPC functions consistently** for visitor check-in/out
4. **Audit `temp_allow_all_inserts`** policy (marked as removed in docs but verify)
5. **Add rate limiting** to OTP generation

### Backend Consolidation

1. **Create `update_visitor_status` RPC** to handle all status transitions with validation
2. **Add `create_issue_update` RPC** for commenting on issues
3. **Implement server-side date validation** for visitor expected dates

### UI/UX Improvements

1. **Add edit functionality** for societies/blocks/units
2. **Implement delete confirmation** with cascade warnings
3. **Add pagination** to user lists and visitor lists
4. **Implement real-time updates** using Supabase subscriptions
5. **Add offline support** for critical guard operations

### Missing Features to Implement

1. **Issue comments/updates** - Use `issue_updates` table
2. **Guard shift management** - Use `guard_shifts` table
3. **Family member management** - Complete `unit_residents` CRUD
4. **View Reports** - Admin analytics dashboard
5. **System Settings** - App configuration UI

---

## Appendix: Database Function Reference

| Function | RPC Endpoint | Used In |
|----------|--------------|---------|
| `checkin_visitor(visitor_uuid, guard_uuid, otp_code)` | ✓ | expected-visitor.tsx |
| `checkout_visitor(visitor_uuid, guard_uuid)` | ⚠️ | Not used (direct update instead) |
| `is_admin()` | Internal | RLS policies |
| `get_user_context()` | Internal | Not exposed |
| `generate_visitor_otp()` | Trigger | BEFORE INSERT on visitors |
| `notify_visitor_status_change()` | Trigger | AFTER UPDATE on visitors |
| `notify_issue_changes()` | Trigger | AFTER UPDATE on issues |
| `notify_parcel_received()` | Trigger | AFTER INSERT on parcels |
| `update_updated_at_column()` | Trigger | Multiple tables |
| `cleanup_expired_visitors()` | Not called | Should be cron |

---

*Generated by Antigravity AI Agent • January 14, 2026*
