# Manual Testing Guide for GATED App

This guide outlines the manual testing procedures for the GATED application, covering "End-to-End" flows for all user roles (Resident, Guard, Manager, Admin).

## 1. Prerequisites

- **Environment**: Ensure the development server is running.
  ```bash
  npm start
  ```
- **Database**: Ensure Supabase is connected and migrations are applied.
- **Device**: Test on a simulator (iOS/Android) or a physical device using Expo Go.

## 2. Authentication & Navigation

### 2.1 Developer Login (Fast Testing)
The login screen includes "Developer Access" buttons to quickly switch roles without OTP verification.

**Test Case**: Verify Role Switching
1. Open the App.
2. Locate the "Developer Access" section at the bottom of the Login screen.
3. Tap **"Guard"**. Verify you are redirected to the Guard Dashboard.
4. Logout (if available) or Restart App.
5. Repeat for **"Resident"**, **"Manager"**, and **"Admin"**.

**Expected Result**: Each button should navigate to the correct role-specific dashboard.

### 2.2 OTP Login (Production Flow)
**Test Case**: Verify OTP Flow
1. Enter a valid phone number (e.g., `9876543210`).
2. Tap "Send OTP".
3. Wait for the "Enter OTP" prompt.
4. Enter the received OTP (or default test OTP if configured, e.g., `123456`).
5. Tap "Verify OTP".

**Expected Result**: Successful login redirects to the user's assigned role dashboard.

---

## 3. Resident Flows
*Role: Resident living in a unit.*

### 3.1 Dashboard & Profile
1. **Login as Resident**.
2. **Dashboard**: Check if "My Unit" details (Block/Floor/Unit) are correct.
3. **Profile**: Navigate to the Profile tab.
4. **Update Profile**: Change name or email and save.
   - **Expected**: "Profile updated successfully" toast/alert.

### 3.2 Pre-Approve Visitor
1. Navigate to **"Pre-Approve Visitor"**.
2. **Form Entry**:
   - Name: `Test Visitor`
   - Phone: `9988776655`
   - Type: `Guest`
   - Date/Time: Select a future date.
3. **Submit**: Tap "Pre-approve".
4. **Verification**:
   - Go to **"My Visitors"** tab.
   - **Expected**: The new visitor should appear with status `EXPECTED` (or similar).

### 3.3 Raise Issue
1. Navigate to **"Raise Issue"** (or "Help/Support").
2. **Form Entry**:
   - Category: `Plumbing`
   - Priority: `Medium`
   - Title: `Leaking Tap`
   - Description: `Kitchen tap is leaking.`
   - Photo: (Optional) Test the photo picker.
3. **Submit**: Tap "Submit Complaint".
4. **Expected**: Confirmation message. The issue should now be visible to the Manager.

### 3.4 Notifications
1. Navigate to **"Notifications"**.
2. **Expected**: List of recent alerts (e.g., "Visitor Arrived", "Parcel Collected").

---

## 4. Guard Flows
*Role: Security Guard at the gate.*

### 4.1 Dashboard & Quick Actions
1. **Login as Guard**.
2. **Stats Check**: verify "Visitors Today" and "Currently Inside" counts.
3. **Quick Actions Verification**:
   - Ensure buttons for "Expected Visitor", "Walk-in Visitor", "Parcels", and "Emergency Alert" are visible.
   - **Note**: The "View Visitor History" button at the bottom may be non-functional (pending implementation).

### 4.2 Walk-In Visitor
1. Tap **"Walk-in Visitor"**.
2. **Unit Selection**:
   - Select Block -> Floor -> Unit (e.g., Block A, Floor 1, Unit 101).
3. **Visitor Details**:
   - Name: `Delivery Guy`
   - Phone: `1234567890`
   - Purpose: `Delivery`
4. **Submit**: Tap "Allow Entry" or "Notify Resident".
5. **Expected**: Success message. Resident should ideally receive a notification.

### 4.3 Expected Visitors
1. Tap **"Expected Visitor"**.
2. **Test**: Look for the visitor pre-approved by the Resident (Step 3.2).
3. **Action**: Tap on the visitor to "Check-in".
4. **Expected**: Status changes to `ENTERED`.

### 4.4 Parcels
1. Tap **"Parcels"**.
2. **Add Parcel**:
   - Select Unit (A-101).
   - Enter details (e.g., "Amazon Package").
3. **Submit**: Confirm entry.
4. **Expected**: Parcel logged in the system.

### 4.5 Panic Mode
1. **Test**: Locate the **"Emergency Alert"** button.
2. **Action**: Tap (and confirm if prompted).
3. **Expected**: Emergency alert triggered (check console logs or mock alert).

---

## 5. Manager Flows
*Role: Society Manager.*

### 5.1 Dashboard Overview
1. **Login as Manager**.
2. **Check Stats**: Verify counts for "Total Visitors", "Open Issues", etc. match recent activity.

### 5.2 Create Announcement
1. Navigate to **"Announcements"**.
2. Tap **"Create New"**.
3. **Form Entry**:
   - Title: `Water Cut`
   - Content: `Maintenance on Tuesday.`
   - Target: `All Residents`.
4. **Submit**: Tap "Publish".
5. **Verification**: Login as a Resident and check if the announcement appears.

### 5.3 Manage Issues
1. Navigate to **"Issues"**.
2. **Test**: Find the "Leaking Tap" issue reported in Step 3.3.
3. **Action**: Change status from `OPEN` to `IN_PROGRESS` or `RESOLVED`.
4. **Expected**: Status updates in the list. Resident should see the update.

### 5.4 Visitor Logs
1. Navigate to **"Visitors"**.
2. **Test**: Verify the "Walk-in" and "Pre-approved" visitors from previous steps are listed correctly.

---

## 6. Access Control & Edge Cases

### 6.1 Permission Checks
- **Test**: Try to access Manager pages (e.g., `/manager/issues`) while logged in as a **Resident**.
- **Expected**: Redirect to Resident Dashboard or "Access Denied" error.

### 6.2 Form Validation
- **Test**: Try to submit the "Pre-approve Visitor" form with an empty phone number.
- **Expected**: "Please enter a valid phone number" error message.

---

**End of Guide**
