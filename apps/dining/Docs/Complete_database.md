    # DropBy Database Documentation

## Overview
This document provides a comprehensive overview of the DropBy database structure, including all tables, columns, relationships, and recent changes.

**Last Updated:** October 29, 2025  
**Database Type:** PostgreSQL (Supabase)  
**Total Tables:** 52  
**Total Active Records:** 300+

---

## Recent Major Updates (October 2025)

### New Features Added
- **Event Organizer System**: Complete organizer management with documents and financials
- **Artist Management**: Artist profiles and event associations with Spotify integration
- **Expert System**: Food experts with recommendations for restaurants and events
- **Enhanced Payment System**: Separate payment tracking for restaurants and events with T1/T2 transaction management
- **Settlement System**: Automated settlement tracking for merchants and organizers
- **Enhanced Event System**: Cover charges, ticket types, venue management, and status workflow (draft, coming_soon, active, completed, cancelled)
- **Location Management**: Cities, areas, and places for precise location-based services
- **T1/T2 Transaction Tracking**: Comprehensive dual-phase transaction system for events
- **Event Occurrences System**: Support for one-day, multi-day, and recurring events with occurrence management
- **Individual Ticket Management**: New event_checkins table for individual ticket tracking, sharing, and check-in management

### System Improvements
- **Enhanced Security**: Row Level Security (RLS) implemented on critical tables
- **Better Data Structure**: JSONB fields for flexible data storage
- **Improved Relationships**: Better foreign key constraints and referential integrity
- **Financial Tracking**: Comprehensive payment and settlement tracking with T1/T2 dual-phase system
- **Advanced Transaction Management**: Separate tracking for ticket purchases (T1) and venue payments (T2)

---

## T1/T2 Transaction System

### Overview
The DropBy platform implements a sophisticated dual-phase transaction system for events, separating ticket purchases (T1) from venue payments (T2). This system provides granular financial tracking and enables complex event payment scenarios.

### Transaction Phases

#### T1 Transaction (Ticket Purchase/Initial Booking)
- **Purpose**: Initial ticket purchase or event booking
- **Scope**: Ticket price, T1 convenience fee, T1 commission
- **Status Tracking**: `t1_status` (pending/paid/failed)
- **Amount Tracking**: `t1_final_payable_amount`
- **Use Cases**: 
  - Paid event ticket purchases
  - Free event slot bookings with cover charges

#### T2 Transaction (Venue Payment/Bill Settlement)
- **Purpose**: Final venue payment or bill settlement
- **Scope**: Gross bill amount, T2 convenience fee, T2 commission
- **Status Tracking**: `t2_status` (pending/paid/failed)
- **Amount Tracking**: `t2_final_payable_amount`
- **Use Cases**:
  - Venue bill payment after dining
  - Additional charges or services

### Implementation Details

#### Event Bookings Table
- `transaction_status`: Tracks overall transaction progress (T1/T2/T1,T2)
- Links to event_payments for detailed financial breakdown

#### Event Payments Table
- Comprehensive T1/T2 financial tracking
- Separate commission and convenience fee tracking
- Individual organizer due amounts for each phase
- Customer total paid accumulation across phases

#### Event Transactions Table
- Individual transaction records for gateway integration
- Purpose-based categorization (ticket_purchase, venue_payment, etc.)
- Gateway response storage for audit trails

---

## Database Tables

### 1. Users Table
**Purpose:** Core user account information and authentication.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| firebase_uid | text | YES | null | Firebase authentication UID (unique) |
| email | text | YES | null | User's email address |
| phone_number | text | NO | null | User's phone number (required, unique) |
| full_name | text | YES | null | User's full name |
| profile_image_url | text | YES | null | URL to user's profile image |
| is_verified | boolean | YES | false | User verification status |
| role | text | YES | 'user' | User role (user, business, admin) |
| created_at | timestamptz | YES | now() | Account creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |
| is_active | boolean | YES | true | Account active status |
| preferred_cuisines | text[] | YES | null | Array of preferred cuisine types |
| notification_preferences | jsonb | YES | default | Notification settings JSON |
| firebase_fcm | text | YES | null | Firebase FCM token for push notifications |
| current_latitude | numeric | YES | null | Current GPS latitude |
| current_longitude | numeric | YES | null | Current GPS longitude |
| current_city | text | YES | null | Current city name |
| last_location_update | timestamptz | YES | now() | Last location update time |
| current_area | text | YES | null | Current area/locality |
| current_state | text | YES | null | Current state |
| current_full_address | text | YES | null | Full address string |
| push_notification_token | text | YES | null | Push notification token |

**Constraints:** Role check (user, business, admin)  
**Records:** 6 active users  
**RLS:** Disabled

### 2. Restaurants Table
**Purpose:** Restaurant information, location, and business details.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| owner_id | uuid | NO | null | Reference to users table |
| name | text | NO | null | Restaurant name |
| description | text | YES | null | Restaurant description |
| address | text | NO | null | Restaurant address |
| city | text | NO | null | City location |
| state | text | NO | null | State location |
| postal_code | text | YES | null | Postal code |
| phone_number | text | YES | null | Restaurant phone |
| email | text | YES | null | Restaurant email |
| website | text | YES | null | Restaurant website |
| opening_hours | jsonb | YES | null | Operating hours data |
| rating | numeric | YES | 0.0 | Average rating |
| total_reviews | integer | YES | 0 | Number of reviews |
| cover_image_url | text | YES | null | Main restaurant image |
| gallery_images | text[] | YES | null | Additional images array |
| is_verified | boolean | YES | false | Verification status |
| is_active | boolean | YES | true | Active status |
| latitude | numeric | YES | null | GPS latitude |
| longitude | numeric | YES | null | GPS longitude |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |
| google_maps_place_id | text | YES | null | Google Maps place ID |
| more_info | jsonb | YES | '{}' | Additional restaurant info |
| cuisines | text[] | YES | '{}' | Multiple cuisine support (max 3) |
| food_image | jsonb | YES | '[]' | Food images array |
| price_range | integer | YES | null | Price range indicator |
| cover_video_url | text | YES | null | Video URL for restaurant cover |
| capacity | integer | YES | null | Restaurant seating capacity |
| category_id | uuid | YES | null | Reference to restaurant_categories |

**Constraints:** Cuisine limit (≤3), Capacity > 0  
**Records:** 10 active restaurants  
**RLS:** Enabled

### 3. Restaurant Booking Table
**Purpose:** Restaurant table reservations and dining bookings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | null | Reference to users table |
| restaurant_id | uuid | NO | null | Reference to restaurants table |
| booking_date | date | NO | null | Booking date |
| booking_time | time | NO | null | Booking time |
| party_size | integer | NO | null | Number of people |
| duration_minutes | integer | YES | 120 | Booking duration |
| customer_name | text | NO | null | Customer name |
| customer_phone | text | NO | null | Customer phone |
| customer_email | text | YES | null | Customer email |
| special_requests | text | YES | null | Special requests |
| status | text | YES | 'pending' | Booking status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |
| confirmed_at | timestamptz | YES | null | Confirmation timestamp |
| cancelled_at | timestamptz | YES | null | Cancellation timestamp |
| advance_payment | numeric | YES | 0 | Advance payment amount |
| meal_period | text | YES | null | Meal period (breakfast/lunch/dinner) |
| booking_end_time | time | YES | null | Booking end time |
| offer_id | uuid | YES | null | Applied offer ID |
| total_cover_charge | numeric | YES | 0 | Total cover charge |
| cover_charge_per_person | numeric | YES | 0 | Cover charge per person |
| final_bill_amount | numeric | YES | 0 | Final bill amount |

**Constraints:** Status check (pending, confirmed, cancelled, completed, no_show)  
**Records:** 9 active bookings  
**RLS:** Enabled

### 4. Events Table
**Purpose:** Core events information with comprehensive event management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| organizer_id | uuid | NO | null | Reference to users table |
| restaurant_id | uuid | YES | null | Associated restaurant |
| title | text | NO | null | Event title |
| description | text | YES | null | Event description |
| event_type | text | YES | null | Event duration type |
| event_date | date | NO | null | Event start date |
| start_time | time | NO | null | Event start time |
| end_time | time | YES | null | Event end time |
| cover_image_url | text | YES | null | Event cover image |
| gallery_images | text[] | YES | null | Event gallery array |
| is_active | boolean | YES | true | Active status |
| is_featured | boolean | YES | false | Featured event flag |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |
| category_id | uuid | YES | null | Event category reference |
| cover_video_url | text | YES | null | Event cover video |
| ticket_type | text | YES | 'paid' | Ticket type (paid/free) |
| event_end_date | date | YES | null | Event end date (multi-day) |
| event_scope | text[] | YES | '{event}' | Event scope array |
| status | text | YES | 'active' | Event status workflow |
| booking_open_date | timestamptz | YES | null | Booking open date/time |
| city | text | YES | null | Event city |
| state | text | YES | null | Event state |
| latitude | numeric | YES | null | GPS latitude |
| longitude | numeric | YES | null | GPS longitude |
| is_recurring | boolean | YES | false | Recurring event flag |
| recurrence_pattern | text | YES | 'none' | Recurrence pattern |
| recurrence_days | integer[] | YES | '{}' | Recurrence days array |
| recurrence_exceptions | date[] | YES | '{}' | Exception dates array |
| next_occurrence_date | date | YES | null | Next occurrence date |
| last_occurrence_date | date | YES | null | Last occurrence date |
| slug | text | YES | null | URL-friendly identifier |
| seo_title | text | YES | null | SEO page title |
| meta_description | text | YES | null | SEO meta description |
| price_display_string | text | YES | null | Price display text (e.g., "400", "1599") |
| booking_type | text | YES | 'normal' | Booking type (normal/layout/seat) |
| transaction_mode | text | YES | 'T1' | Transaction mode (T1/T1,T2) |
| pay_bill_enabled | boolean | GENERATED | - | Auto-generated: true when transaction_mode is T1,T2 |

**Constraints:** Event type check (one_day, multi_day, daily_event, recurring, dining, concert, party, corporate, wedding, other), Ticket type check (free/paid), Scope validation (event, activity), Status check (draft, coming_soon, active, completed, cancelled), Recurrence pattern check (none, daily, weekly, monthly), Booking type check (normal, layout, seat), Transaction mode check (T1, T1,T2)  
**Records:** 19 active events  
**RLS:** Enabled  
**Note:** `transaction_mode` determines if event is ticket-only (T1) or has venue payment/bill option (T1,T2). `pay_bill_enabled` is auto-computed based on transaction_mode.

### 5. Event Bookings Table
**Purpose:** Event ticket purchases and slot bookings with comprehensive T1/T2 transaction management and check-in summary tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | null | Reference to users table |
| event_id | uuid | NO | null | Reference to events table |
| occurrence_id | uuid | YES | null | Reference to event_occurrences table |
| tickets_count | integer | NO | 1 | Number of tickets |
| gross_amount | numeric | YES | null | Total booking amount |
| customer_name | text | NO | null | Customer name |
| customer_phone | text | NO | null | Customer phone |
| customer_email | text | YES | null | Customer email |
| status | text | YES | 'pending' | Booking status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |
| ticket_id | uuid | YES | null | Ticket type reference |
| master_ticket | text | YES | null | Master booking QR (BOOK-ABC123) |
| booking_date | date | YES | null | Booking date (free events) |
| booking_time | text | YES | null | Time slot (free events) |
| time_section | text | YES | null | Time section |
| party_size | integer | YES | 1 | Party size |
| special_requests | text | YES | null | Special requests |
| booking_type | text | YES | 'paid' | Booking type (free/paid) |
| offer_id | uuid | YES | null | Applied event offer |
| cover_charge_per_person | numeric | YES | 25 | Cover charge per person |
| total_cover_charge | numeric | YES | 0 | Total cover charge |
| final_amount | numeric | YES | 0 | Final amount |
| advance_payment | numeric | YES | 0 | Advance payment |
| booking_end_time | text | YES | null | End time |
| transaction_status | text | YES | 'T1' | Transaction status tracking (T1/T2/T1,T2) |
| total_checked_in | integer | YES | 0 | Count of checked-in tickets |
| all_checked_in | boolean | YES | false | All tickets checked in flag |
| first_check_in_at | timestamptz | YES | null | First ticket check-in time |
| last_check_in_at | timestamptz | YES | null | Last ticket check-in time |

**Constraints:** Status check (pending, confirmed, cancelled, completed), Booking type check (free/paid), Transaction status check (T1/T2/T1,T2), Unique master_ticket  
**Records:** 5 active bookings  
**RLS:** Enabled  
**Note:** Individual ticket check-ins are tracked in event_checkins table. This table contains summary information.

### 6. Event Categories Table
**Purpose:** Event categorization system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| name | text | NO | null | Category name (unique) |
| description | text | YES | null | Category description |
| icon | text | YES | null | Category icon |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Records:** 15 active categories  
**RLS:** Enabled

### 7. Event Ticket Types Table
**Purpose:** Event ticket types with pricing and cover charge system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| event_id | uuid | NO | null | Reference to events table |
| name | text | NO | null | Ticket type name |
| description | text | YES | null | Ticket description |
| price | numeric | NO | null | Ticket price |
| total_quantity | integer | NO | null | Total available |
| sold_quantity | integer | YES | 0 | Tickets sold |
| features | text[] | YES | null | Ticket features array |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| ticket_cover_enabled | boolean | YES | false | Cover charge enabled |
| ticket_cover_amount | numeric | YES | 0.0 | Cover charge amount |
| ticket_cover_title | text | YES | 'Cover Charge' | Cover charge title |
| entry_fee_amount | numeric | YES | 0.0 | Base entry fee |

**Records:** 22 active ticket types  
**RLS:** Enabled

### 8. User Favorites Table
**Purpose:** User's favorite restaurants and events.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | null | Reference to users table |
| restaurant_id | uuid | YES | null | Favorite restaurant |
| event_id | uuid | YES | null | Favorite event |
| type | text | NO | null | Favorite type (restaurant/event) |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Constraints:** Type check (restaurant/event)  
**Records:** 0 active favorites  
**RLS:** Enabled

### 9. User Preferences Table
**Purpose:** Detailed user preferences and settings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | null | Reference to users table (unique) |
| preferred_cuisines | uuid[] | YES | '{}' | Preferred cuisine UUIDs |
| preferred_price_range | text | YES | null | Price range preference |
| preferred_location | text | YES | null | Location preference |
| dietary_restrictions | text[] | YES | null | Dietary restrictions array |
| notification_preferences | jsonb | YES | default | Notification settings |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Constraints:** Price range check ($, $$, $$$, $$$$)  
**Records:** 0 active preferences  
**RLS:** Enabled

### 10. Restaurant Promotions Table
**Purpose:** Restaurant promotional offers and discounts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| restaurant_id | uuid | NO | null | Reference to restaurants |
| title | text | NO | null | Promotion title |
| description | text | YES | null | Promotion description |
| type | text | NO | null | Promotion type |
| value | numeric | NO | null | Discount value |
| min_bill_amount | numeric | YES | 0 | Minimum bill requirement |
| max_discount | numeric | YES | null | Maximum discount cap |
| valid_days | integer[] | YES | '{0,1,2,3,4,5,6}' | Valid weekdays |
| valid_time_start | time | YES | null | Valid from time |
| valid_time_end | time | YES | null | Valid until time |
| valid_from | timestamptz | NO | null | Valid from date |
| valid_until | timestamptz | NO | null | Valid until date |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Constraints:** Type check (percentage_off, fixed_amount_off, free_appetizer, buy_one_get_one, happy_hours)  
**Records:** 0 active promotions  
**RLS:** Enabled

### 11. Event Promotions Table
**Purpose:** Event promotional offers and early bird discounts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| event_id | uuid | NO | null | Reference to events |
| title | text | NO | null | Promotion title |
| description | text | YES | null | Promotion description |
| type | text | NO | null | Promotion type |
| value | numeric | NO | null | Discount value |
| min_tickets | integer | YES | 1 | Minimum tickets |
| valid_from | timestamptz | NO | null | Valid from |
| valid_until | timestamptz | NO | null | Valid until |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Constraints:** Type check (early_bird, group_discount, student_discount, member_discount)  
**Records:** 0 active promotions  
**RLS:** Enabled

### 12. Payment Methods Table
**Purpose:** User payment methods storage.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | null | Reference to users table |
| type | text | NO | null | Payment method type |
| provider | text | YES | null | Payment provider |
| details | jsonb | NO | null | Payment details JSON |
| is_default | boolean | YES | false | Default method flag |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Constraints:** Type check (card, upi, wallet, netbanking)  
**Records:** 0 active payment methods  
**RLS:** Enabled

### 13. Restaurant Transactions Table
**Purpose:** Restaurant payment transaction records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | null | Reference to users table |
| booking_id | uuid | YES | null | Associated booking |
| amount | numeric | NO | null | Transaction amount |
| currency | text | YES | 'INR' | Currency code |
| transaction_id | text | YES | null | External transaction ID (unique) |
| status | text | NO | null | Transaction status |
| purpose | text | NO | null | Transaction purpose |
| gateway_response | jsonb | YES | null | Payment gateway response |
| created_at | timestamptz | YES | now() | Creation timestamp |
| restaurant_payment_id | uuid | YES | null | Restaurant payment reference |

**Constraints:** Status check (pending, success, failed, refunded), Purpose check  
**Records:** 9 active transactions  
**RLS:** Enabled

### 14. Notifications Table
**Purpose:** User notification system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | null | Reference to users table |
| type | text | NO | null | Notification type |
| title | text | NO | null | Notification title |
| message | text | NO | null | Notification message |
| data | jsonb | YES | null | Additional data JSON |
| is_read | boolean | YES | false | Read status |
| sent_at | timestamptz | YES | now() | Sent timestamp |
| read_at | timestamptz | YES | null | Read timestamp |

**Constraints:** Type check (booking_confirmation, booking_reminder, event_reminder, promotion, review_request, general)  
**Records:** 0 active notifications  
**RLS:** Enabled

### 15. Support Tickets Table
**Purpose:** Customer support ticket system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | null | Reference to users table |
| restaurant_id | uuid | YES | null | Related restaurant |
| booking_id | uuid | YES | null | Related booking |
| event_booking_id | uuid | YES | null | Related event booking |
| subject | text | NO | null | Ticket subject |
| description | text | NO | null | Ticket description |
| status | text | YES | 'open' | Ticket status |
| priority | text | YES | 'medium' | Ticket priority |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Constraints:** Status check (open, in_progress, resolved, closed), Priority check (low, medium, high, urgent)  
**Records:** 0 active tickets  
**RLS:** Enabled

### 16. Support Messages Table
**Purpose:** Messages within support tickets.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| ticket_id | uuid | NO | null | Reference to support_tickets |
| sender_id | uuid | NO | null | Message sender |
| message | text | NO | null | Message content |
| attachments | text[] | YES | null | File attachments array |
| is_from_support | boolean | YES | false | Support team message flag |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Records:** 0 active messages  
**RLS:** Enabled

### 17. Restaurant Analytics Table
**Purpose:** Daily analytics for restaurants.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| restaurant_id | uuid | NO | null | Reference to restaurants |
| date | date | NO | null | Analytics date |
| total_bookings | integer | YES | 0 | Daily bookings |
| total_events | integer | YES | 0 | Daily events |
| total_views | integer | YES | 0 | Page views |
| avg_rating | numeric | YES | 0.0 | Average rating |
| total_revenue | numeric | YES | 0 | Daily revenue |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Records:** 0 active analytics  
**RLS:** Enabled

### 18. User Activity Logs Table
**Purpose:** User action tracking for analytics.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | null | Reference to users table |
| action | text | NO | null | Action performed |
| entity_type | text | YES | null | Entity type affected |
| entity_id | uuid | YES | null | Entity ID |
| metadata | jsonb | YES | null | Additional data JSON |
| ip_address | inet | YES | null | User IP address |
| user_agent | text | YES | null | User agent string |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Records:** 0 active logs  
**RLS:** Enabled

### 19. Restaurant Menu Categories Table
**Purpose:** Restaurant menu organization system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| restaurant_id | uuid | NO | null | Reference to restaurants |
| name | text | NO | null | Category name |
| images | jsonb | YES | '[]' | Category images array |
| display_order | integer | NO | 1 | Display order |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Records:** 3 active categories  
**RLS:** Enabled

### 20. Event Guide Table
**Purpose:** Event guide information and details.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| event_id | uuid | NO | null | Reference to events table |
| guide_data | jsonb | NO | '{}' | Guide content JSON |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Records:** 4 active guides  
**RLS:** Disabled

### 21. Event Venue Table
**Purpose:** Event venue-specific information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| event_id | uuid | NO | null | Reference to events table |
| venue_data | jsonb | NO | '{}' | Venue details JSON |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |
| restaurant_id | uuid | YES | null | Associated restaurant |

**Records:** 5 active venues  
**RLS:** Disabled

### 22. Event FAQ Terms Table
**Purpose:** Event FAQ and terms & conditions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| event_id | uuid | NO | null | Reference to events table |
| content_data | jsonb | NO | '{}' | FAQ/Terms content JSON |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Records:** 4 active FAQ/Terms  
**RLS:** Disabled

### 23. Event Prohibited Items Table
**Purpose:** Event prohibited items management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| event_id | uuid | NO | null | Reference to events table |
| items_data | jsonb | NO | '[]' | Prohibited items array |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Records:** 4 active prohibited lists  
**RLS:** Disabled

### 24. Event Experiences Table
**Purpose:** Event experiences and activities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| event_id | uuid | NO | null | Reference to events table |
| name | varchar | NO | null | Experience name |
| image_url | text | YES | null | Experience image URL |
| description | text | YES | null | Experience description |
| display_order | integer | YES | 0 | Display order |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Records:** 13 active experiences  
**RLS:** Disabled

### 25. Event Partners Table
**Purpose:** Event partners and sponsors.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| event_id | uuid | NO | null | Reference to events table |
| name | varchar | NO | null | Partner name |
| logo_url | text | YES | null | Partner logo URL |
| website_url | text | YES | null | Partner website URL |
| partner_type | varchar | YES | null | Partner type |
| display_order | integer | YES | 0 | Display order |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Records:** 11 active partners  
**RLS:** Disabled

### 26. Restaurant Slot Blocks Table
**Purpose:** Restaurant slot blocking management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| restaurant_id | uuid | NO | null | Reference to restaurants |
| block_date | date | YES | null | Block date |
| start_time | time | YES | null | Start time |
| end_time | time | YES | null | End time |
| apply_date_time | timestamptz | YES | null | Apply date and time |
| is_active | boolean | YES | true | Active status |
| reason | text | YES | null | Block reason |
| created_at | timestamptz | YES | now() | Creation timestamp |
| block_end_date | date | YES | null | End date for block period |

**Records:** 1 active block  
**RLS:** Disabled

### 27. Dinein Offers Table
**Purpose:** Restaurant dine-in offers and discounts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| restaurant_id | uuid | NO | null | Reference to restaurants |
| title | text | NO | null | Offer title |
| description | text | YES | null | Offer description |
| discount_type | text | YES | null | Discount type |
| discount_value | numeric | NO | null | Discount value |
| slot_data | jsonb | NO | '{}' | Time slot data JSON |
| conditions | jsonb | YES | '{}' | Offer conditions JSON |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Constraints:** Discount type check (percentage, flat, bogo)  
**Records:** 21 active offers  
**RLS:** Enabled

### 28. Dinein Offer Redemptions Table
**Purpose:** Restaurant offer usage tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| offer_id | uuid | NO | null | Reference to dinein_offers |
| user_id | uuid | NO | null | Reference to users |
| slot_label | text | YES | null | Time slot used |
| redemption_date | date | NO | null | Redemption date |
| quantity | integer | YES | 1 | Quantity redeemed |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Records:** 6 active redemptions  
**RLS:** Enabled

### 29. Event Offers Table
**Purpose:** Event-specific offers and discounts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| event_id | uuid | NO | null | Reference to events |
| title | text | NO | null | Offer title |
| description | text | YES | null | Offer description |
| discount_type | text | YES | null | Discount type |
| discount_value | numeric | NO | null | Discount value |
| slot_data | jsonb | NO | '{}' | Time slot data JSON |
| conditions | jsonb | YES | '{}' | Offer conditions JSON |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Constraints:** Discount type check (percentage, flat, bogo)  
**Records:** 3 active offers  
**RLS:** Enabled

### 30. Event Offer Redemptions Table
**Purpose:** Event offer usage tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| offer_id | uuid | NO | null | Reference to event_offers |
| user_id | uuid | NO | null | Reference to users |
| slot_label | text | YES | null | Time slot label |
| redemption_date | date | NO | null | Redemption date |
| quantity | integer | YES | 1 | Quantity redeemed |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Records:** 1 active redemption  
**RLS:** Enabled

### 31. Artists Table
**Purpose:** Artist profiles and information with Spotify integration.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| name | text | NO | null | Artist name |
| bio | text | YES | null | Artist biography |
| profile_image_url | text | YES | null | Profile image URL |
| social_links | jsonb | YES | '{}' | Social media links JSON |
| genre | text | YES | null | Music/performance genre |
| spotify_id | text | YES | null | Spotify artist ID (unique) |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |
| phone_number | text | YES | null | Contact phone number |

**Records:** 5 active artists  
**RLS:** Enabled  
**Note:** Spotify integration allows fetching artist data, genres, followers, and top tracks from Spotify API

### 32. Event Artists Table
**Purpose:** Artist-event associations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| event_id | uuid | NO | null | Reference to events table |
| artist_id | uuid | NO | null | Reference to artists table |
| display_order | integer | YES | 0 | Display order |
| role | text | YES | null | Artist role |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Records:** 4 active associations  
**RLS:** Enabled

### 33. Restaurant Categories Table
**Purpose:** Restaurant categorization system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| name | text | NO | null | Category name (unique) |
| description | text | YES | null | Category description |
| icon | text | YES | null | Category icon |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Records:** 10 active categories  
**RLS:** Enabled

### 34. Restaurant Documents Table
**Purpose:** Restaurant verification documents.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| restaurant_id | uuid | NO | null | Reference to restaurants |
| pan_card_url | text | YES | null | PAN card document URL |
| gst_certificate_url | text | YES | null | GST certificate URL |
| cancelled_cheque_url | text | YES | null | Cancelled cheque URL |
| mobile_number | text | NO | null | Contact mobile number |
| email | text | NO | null | Contact email |
| verification_status | text | YES | 'pending' | Verification status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Records:** 3 active documents  
**RLS:** Disabled

### 35. Restaurant Financials Table
**Purpose:** Restaurant financial information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| restaurant_id | uuid | NO | null | Reference to restaurants |
| razorpay_account_id | text | YES | null | Razorpay account ID (unique) |
| bank_account_number | text | YES | null | Bank account number |
| ifsc_code | text | YES | null | Bank IFSC code |
| kyc_status | text | YES | 'pending' | KYC verification status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Records:** 3 active financial records  
**RLS:** Disabled

### 36. Restaurant Payments Table
**Purpose:** Restaurant payment processing records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| booking_id | uuid | NO | null | Reference to restaurant_booking |
| user_id | uuid | NO | null | Reference to users |
| restaurant_id | uuid | NO | null | Reference to restaurants |
| gross_bill_amount | numeric | NO | null | Gross bill amount |
| discount_amount | numeric | YES | 0 | Discount applied |
| cover_charge | numeric | YES | 0 | Cover charge amount |
| convenience_fee | numeric | YES | 0 | Convenience fee |
| final_payable_amount | numeric | NO | null | Final payable amount |
| commission_rate | numeric | YES | 0 | Commission rate % |
| commission_amount | numeric | YES | 0 | Commission amount |
| merchant_due | numeric | YES | 0 | Amount due to merchant |
| platform_earnings | numeric | YES | 0 | Platform earnings |
| payment_id | text | YES | null | Payment gateway ID |
| status | text | YES | 'pending' | Payment status |
| settlement_status | text | YES | 'pending' | Settlement status |
| settled_at | timestamptz | YES | null | Settlement timestamp |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Records:** 4 active payments  
**RLS:** Disabled

### 37. Merchant Settlements Table
**Purpose:** Restaurant settlement tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| restaurant_id | uuid | NO | null | Reference to restaurants |
| total_due | numeric | NO | null | Total amount due |
| payout_id | text | YES | null | Payout transaction ID |
| status | text | YES | 'pending' | Settlement status |
| payout_date | timestamptz | YES | null | Payout date |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Records:** 3 active settlements

### 38. Event Payments Table
**Purpose:** Event payment processing with detailed T1/T2 transaction breakdown and comprehensive financial tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| event_booking_id | uuid | NO | null | Reference to event_bookings |
| user_id | uuid | NO | null | Reference to users |
| event_id | uuid | NO | null | Reference to events |
| organizer_id | uuid | NO | null | Reference to users (organizer) |
| event_type | text | NO | null | Event type (free/paid) |
| ticket_price | numeric | YES | 0 | Base ticket price |
| cover_charge | numeric | YES | 25 | Cover charge amount |
| convenience_fee_rate | numeric | YES | 5 | Convenience fee rate % |
| convenience_fee_amount | numeric | YES | 0 | Total convenience fee amount |
| gross_amount | numeric | YES | null | Gross bill amount (T2) |
| commission_rate | numeric | YES | 0 | Commission rate % |
| commission_amount | numeric | YES | 0 | Total commission amount |
| organizer_due | numeric | YES | 0 | Total amount due to organizer |
| platform_earnings | numeric | YES | 0 | Total platform earnings |
| payment_id | text | YES | null | Payment gateway ID |
| status | text | YES | 'pending' | Overall payment status |
| settlement_status | text | YES | 'pending' | Settlement status |
| settled_at | timestamptz | YES | null | Settlement timestamp |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |
| ticket_cover_amount | numeric | YES | 0.0 | Ticket cover charge |
| discount_amount | numeric | YES | 0 | Discount applied |
| transaction_status | text | YES | 'T1' | Transaction status (T1/T2/T1,T2) |
| t1_commission_amount | numeric | YES | 0 | T1 commission amount |
| t2_commission_amount | numeric | YES | 0 | T2 commission amount |
| t1_convenience_fee | numeric | YES | 0 | T1 convenience fee |
| t2_convenience_fee | numeric | YES | 0 | T2 convenience fee |
| customer_total_paid | numeric | YES | 0 | Total paid by customer |
| t1_organizer_due | numeric | YES | 0 | T1 organizer due amount |
| t2_organizer_due | numeric | YES | 0 | T2 organizer due amount |
| t1_status | text | YES | 'pending' | T1 transaction status |
| t2_status | text | YES | 'pending' | T2 transaction status |
| t1_final_payable_amount | numeric | YES | 0 | T1 final payable amount |
| t2_final_payable_amount | numeric | YES | 0 | T2 final payable amount |

**Constraints:** Event type check (free/paid), Transaction status check (T1/T2/T1,T2), T1 status check (pending/paid/failed), T2 status check (pending/paid/failed)  
**Records:** 2 active payments  
**RLS:** Disabled

### 39. Event Settlements Table
**Purpose:** Event organizer settlement tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| organizer_id | uuid | NO | null | Reference to users |
| event_id | uuid | YES | null | Reference to events |
| total_due | numeric | NO | null | Total amount due |
| payout_id | text | YES | null | Payout transaction ID |
| status | text | YES | 'pending' | Settlement status |
| payout_date | timestamptz | YES | null | Payout date |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Records:** 3 active settlements

### 40. Event Transactions Table
**Purpose:** Individual event transaction records with gateway integration and comprehensive tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | null | Reference to users |
| event_booking_id | uuid | YES | null | Reference to event_bookings |
| event_payment_id | uuid | YES | null | Reference to event_payments |
| amount | numeric | NO | null | Transaction amount |
| currency | text | YES | 'INR' | Currency code |
| transaction_id | text | YES | null | External transaction ID (unique) |
| status | text | YES | null | Transaction status |
| purpose | text | YES | null | Transaction purpose |
| gateway_response | jsonb | YES | null | Payment gateway response |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Constraints:** Status check (pending, success, failed, refunded), Purpose check (cover_charge, ticket_purchase, venue_payment, refund), Unique transaction_id  
**Records:** 3 active transactions  
**RLS:** Disabled

### 41. Event Financials Table
**Purpose:** Event organizer financial information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| organizer_id | uuid | NO | null | Reference to users |
| razorpay_account_id | text | YES | null | Razorpay account ID (unique) |
| bank_account_number | text | YES | null | Bank account number |
| ifsc_code | text | YES | null | Bank IFSC code |
| account_holder_name | text | YES | null | Account holder name |
| kyc_status | text | YES | 'pending' | KYC verification status |
| verification_documents | jsonb | YES | '{}' | Verification documents JSON |
| business_type | text | YES | null | Business type |
| gst_number | text | YES | null | GST number |
| pan_number | text | YES | null | PAN number |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Records:** 4 active financial records  
**RLS:** Disabled

### 42. Organizer Documents Table
**Purpose:** Event organizer verification documents.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| organizer_id | uuid | NO | null | Reference to users |
| pan_card_url | text | YES | null | PAN card document URL |
| aadhar_card_url | text | YES | null | Aadhar card document URL |
| bank_statement_url | text | YES | null | Bank statement URL |
| cancelled_cheque_url | text | YES | null | Cancelled cheque URL |
| gst_certificate_url | text | YES | null | GST certificate URL |
| mobile_number | text | NO | null | Contact mobile number |
| email | text | NO | null | Contact email |
| business_address | text | YES | null | Business address |
| verification_status | text | YES | 'pending' | Verification status |
| verified_at | timestamptz | YES | null | Verification timestamp |
| verified_by | uuid | YES | null | Verified by user ID |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Records:** 4 active documents  
**RLS:** Disabled

### 43. Experts Table
**Purpose:** Food expert profiles and information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| name | text | NO | null | Expert name |
| description | text | YES | null | Expert description/bio |
| tag | text | YES | null | Expert tag/specialty |
| city | text | YES | null | Expert city location |
| address | text | YES | null | Expert address |
| phone_number | text | YES | null | Contact phone number |
| cover_image_url | text | YES | null | Expert profile image |
| is_verified | boolean | YES | false | Verification status |
| social_links | jsonb | YES | '{}' | Social media links JSON |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |
| is_active | boolean | YES | true | Active status |

**Records:** 3 active experts  
**RLS:** Enabled

### 44. Expert Recommendations Table
**Purpose:** Expert recommendations for restaurants and events.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| expert_id | uuid | NO | null | Reference to experts table |
| title | text | NO | null | Recommendation title |
| sub_title | text | YES | null | Recommendation subtitle |
| description | text | YES | null | Recommendation description |
| cover_image_url | text | YES | null | Recommendation cover image |
| city | text | YES | null | City location |
| scope | text[] | YES | '{recommendation}' | Recommendation scope array |
| restaurant_id | uuid | YES | null | Associated restaurant |
| event_id | uuid | YES | null | Associated event |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Records:** 2 active recommendations  
**RLS:** Enabled

### 45. Cities Table
**Purpose:** City management for location-based filtering and content organization.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| name | text | NO | null | City name (unique) |
| display_order | integer | YES | 0 | Display order |
| cover_image_url | text | YES | null | City cover image |
| latitude | numeric | YES | null | GPS latitude |
| longitude | numeric | YES | null | GPS longitude |
| description | text | YES | null | City description |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Records:** 6 active cities  
**RLS:** Disabled

### 46. City Areas Table
**Purpose:** Area/locality management within cities for precise location targeting.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| city_id | uuid | YES | null | Reference to cities table |
| name | text | NO | null | Area name |
| latitude | numeric | YES | null | GPS latitude |
| longitude | numeric | YES | null | GPS longitude |
| radius_km | numeric | YES | 15 | Search radius in kilometers |
| display_order | integer | YES | 0 | Display order |
| cover_image_url | text | YES | null | Area cover image |
| description | text | YES | null | Area description |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Records:** 9 active areas  
**RLS:** Disabled

### 47. Places Table
**Purpose:** Specific places/landmarks within cities for location-based services.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| name | text | NO | null | Place name |
| city_id | uuid | NO | null | Reference to cities table |
| latitude | numeric | YES | null | GPS latitude |
| longitude | numeric | YES | null | GPS longitude |
| radius_km | numeric | YES | 3 | Search radius in kilometers |
| is_popular | boolean | YES | false | Popular place flag |
| cover_image_url | text | YES | null | Place cover image |
| description | text | YES | null | Place description |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Records:** 24 active places  
**RLS:** Disabled

### 48. Event Occurrences Table
**Purpose:** Scheduled occurrences for events (supports one-day, multi-day, and recurring events).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| event_id | uuid | NO | null | Reference to events table |
| occurrence_date | date | NO | null | Date of occurrence |
| start_utc_timestamp | bigint | NO | null | Start time (Unix timestamp UTC) |
| end_utc_timestamp | bigint | NO | null | End time (Unix timestamp UTC) |
| sold_out | boolean | YES | false | Sold out flag |
| is_hidden | boolean | YES | false | Hidden from display |
| status | text | YES | 'scheduled' | Occurrence status |
| capacity | integer | YES | 0 | Total capacity |
| available_tickets | integer | YES | 0 | Available ticket count |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Constraints:** Status check (scheduled, cancelled, completed, expired)  
**Records:** 33 active occurrences  
**RLS:** Disabled  
**Note:** Used for all event types (one_day, multi_day, recurring). Timestamps stored in UTC for consistent timezone handling.

### 49. Event Check-ins Table
**Purpose:** Individual ticket/check-in records for events with support for sharing and independent check-in tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| booking_id | uuid | NO | null | Reference to event_bookings (parent) |
| user_id | uuid | NO | null | Original purchaser user ID |
| event_id | uuid | NO | null | Reference to events table |
| occurrence_id | uuid | YES | null | Reference to event_occurrences |
| ticket_type_id | uuid | YES | null | Reference to event_ticket_types |
| ticket_number | text | NO | null | Unique ticket number (acts as QR) |
| guest_name | text | YES | null | Guest name (ticket holder) |
| guest_phone | text | YES | null | Guest phone number |
| guest_email | text | YES | null | Guest email address |
| assigned_to_user_id | uuid | YES | null | User ID if transferred |
| is_checked_in | boolean | YES | false | Check-in status |
| checked_in_at | timestamptz | YES | null | Check-in timestamp |
| verified_by | text | YES | null | Staff/admin user ID who verified |
| status | text | YES | 'active' | Ticket status |
| ticket_price | numeric | NO | null | Individual ticket price |
| transfer_history | jsonb | YES | '[]' | Transfer history array |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Constraints:** Status check (active, used, cancelled, transferred, expired), Unique ticket_number  
**Records:** 0 active check-ins  
**RLS:** Disabled  
**Note:** Each booking can have multiple check-in records (one per ticket). Supports independent ticket sharing and check-in tracking. Auto-trigger updates parent booking summary on check-in.

### 50. User Favorites (Updated)
**Purpose:** Enhanced user favorites system supporting restaurants, events, artists, and experts.

*Note: This table has been expanded to support artist and expert favorites in addition to restaurants and events.*

### 51. Event Layouts Table
**Purpose:** Event venue layouts with SVG maps for section-based booking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| occurrence_id | uuid | NO | null | Reference to event_occurrences |
| event_id | uuid | NO | null | Reference to events table |
| slug | text | NO | null | URL-friendly identifier (unique) |
| name | text | NO | null | Layout name |
| svg_url | text | NO | null | URL to SVG venue map |
| viewbox | text | YES | null | SVG viewBox attribute |
| has_seat_map | boolean | YES | false | Individual seat maps flag |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Constraints:** Unique slug  
**Records:** 1 active layout  
**RLS:** Enabled  
**Note:** One layout per occurrence, supports multi-day events with different layouts per day.

### 52. Event Layout Sections Table
**Purpose:** Sections within event layouts with capacity tracking and SVG mapping.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| layout_id | uuid | NO | null | Reference to event_layouts |
| polygon_key | text | NO | null | SVG element ID mapping |
| name | text | NO | null | Section display name |
| is_selectable | boolean | YES | true | User can select flag |
| has_seat_map | boolean | YES | false | Individual seats flag |
| fill_color | text | YES | '#3B82F6' | SVG fill color |
| stroke_color | text | YES | '#1E40AF' | SVG stroke color |
| capacity_total | integer | YES | 0 | Total capacity |
| capacity_booked | integer | YES | 0 | Current booked count |
| status | text | YES | 'active' | Section status |
| metadata | jsonb | YES | '{}' | Additional section data |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |
| is_active | boolean | YES | true | Active status |
| bbox_x | numeric | YES | null | Bounding box X |
| bbox_y | numeric | YES | null | Bounding box Y |
| bbox_width | numeric | YES | null | Bounding box width |
| bbox_height | numeric | YES | null | Bounding box height |
| shape_type | varchar | YES | 'rectangle' | Shape type |
| polygon_points | text | YES | null | Shape-specific data |

**Constraints:** Status check (active, sold_out, hidden), Capacity checks (≥0), Shape type validation  
**Records:** 3 active sections  
**RLS:** Enabled  
**Note:** Supports VIP, GA, and other section types with dynamic pricing and availability tracking.

---

## Database Relationships

### Primary Relationships
- **Users → Restaurants**: One-to-many (owner_id) - Users can own multiple restaurants
- **Users → Events**: One-to-many (organizer_id) - Users can organize multiple events
- **Users → Restaurant Bookings**: One-to-many (user_id) - Users can make multiple bookings
- **Users → Event Bookings**: One-to-many (user_id) - Users can book multiple events
- **Restaurants → Restaurant Bookings**: One-to-many (restaurant_id)
- **Events → Event Bookings**: One-to-many (event_id)
- **Events → Event Ticket Types**: One-to-many (event_id)
- **Events → Event Occurrences**: One-to-many (event_id) - Events can have multiple scheduled occurrences
- **Event Bookings → Event Check-ins**: One-to-many (booking_id) - Each booking has multiple individual tickets
- **Event Occurrences → Event Check-ins**: One-to-many (occurrence_id) - Each occurrence has multiple check-ins

### Financial Relationships
- **Restaurant Bookings → Restaurant Payments**: One-to-one (booking_id)
- **Event Bookings → Event Payments**: One-to-one (event_booking_id)
- **Restaurant Payments → Restaurant Transactions**: One-to-many
- **Event Payments → Event Transactions**: One-to-many
- **Restaurants → Merchant Settlements**: One-to-many
- **Users (Organizers) → Event Settlements**: One-to-many

### Content Relationships
- **Events → Event Guide**: One-to-one (event_id)
- **Events → Event Venue**: One-to-one (event_id)
- **Events → Event FAQ Terms**: One-to-one (event_id)
- **Events → Event Prohibited Items**: One-to-one (event_id)
- **Events → Event Experiences**: One-to-many (event_id)
- **Events → Event Partners**: One-to-many (event_id)

### Offer System Relationships
- **Restaurants → Dinein Offers**: One-to-many (restaurant_id)
- **Events → Event Offers**: One-to-many (event_id)
- **Dinein Offers → Dinein Offer Redemptions**: One-to-many
- **Event Offers → Event Offer Redemptions**: One-to-many

### Document & Verification Relationships
- **Restaurants → Restaurant Documents**: One-to-one
- **Restaurants → Restaurant Financials**: One-to-one
- **Users (Organizers) → Organizer Documents**: One-to-one
- **Users (Organizers) → Event Financials**: One-to-one

### Expert System Relationships
- **Experts → Expert Recommendations**: One-to-many (expert_id)
- **Expert Recommendations → Restaurants**: Many-to-one (restaurant_id)
- **Expert Recommendations → Events**: Many-to-one (event_id)

---

## Security Features

### Row Level Security (RLS)
**Enabled Tables (26):**
- users (disabled), restaurants, restaurant_booking, events, event_bookings
- event_categories, event_ticket_types, user_favorites, user_preferences
- restaurant_promotions, event_promotions, payment_methods
- restaurant_transactions, notifications, support_tickets, support_messages
- restaurant_analytics, user_activity_logs, restaurant_menu_categories
- dinein_offers, dinein_offer_redemptions, event_offers, event_offer_redemptions
- artists, event_artists, restaurant_categories
- experts, expert_recommendations

**Disabled Tables (19):**
- restaurant_documents, restaurant_financials, restaurant_payments, merchant_settlements
- event_guide, event_venue, event_faq_terms, event_prohibited_items
- event_experiences, event_partners, restaurant_slot_blocks
- event_payments, event_settlements, event_transactions, event_financials
- organizer_documents

### Data Validation
- **Check Constraints**: Implemented on critical fields (user roles, booking status, payment status)
- **Unique Constraints**: Firebase UID, phone numbers, transaction IDs, Razorpay account IDs, Spotify artist IDs
- **Array Constraints**: Cuisine limits, event scope validation
- **Numeric Constraints**: Positive values for capacity, amounts

---

## Performance Optimizations

### Indexing Strategy
- **Primary Keys**: UUID indexes on all tables
- **Foreign Keys**: Automatic indexes on all foreign key relationships
- **Unique Fields**: Indexes on firebase_uid, phone_number, transaction_id
- **Query Optimization**: Indexes on frequently queried fields (event_date, booking_date, status)

### Data Types
- **UUID**: Used for all primary keys for better distribution
- **JSONB**: Used for flexible data storage with indexing support
- **Arrays**: Used for multi-value fields with proper constraints
- **Timestamps**: All with timezone support for global compatibility

---

## Business Logic

### Booking System
- **Restaurant Bookings**: Table reservations with advance payment support
- **Event Bookings**: Both free (slot-based) and paid (ticket-based) events
- **Cover Charges**: Flexible cover charge system for both restaurants and events
- **Time Management**: Comprehensive time slot and duration tracking

### Payment Processing
- **Multi-Gateway Support**: Razorpay integration with extensible architecture
- **Commission Tracking**: Detailed commission calculation and tracking
- **Settlement System**: Automated settlement processing for merchants and organizers
- **Financial Reporting**: Comprehensive financial data for analytics

### Offer System
- **Restaurant Offers**: Time-based, amount-based, and percentage discounts
- **Event Offers**: Early bird, group, and member discounts
- **Usage Tracking**: Detailed redemption tracking with limits
- **Condition Management**: Flexible condition system via JSONB

---

## Migration History
The database has evolved through 100+ migrations with major milestones:
- **Initial Setup**: Core user and restaurant tables
- **Event System**: Comprehensive event management
- **Payment Integration**: Multi-gateway payment processing
- **Offer System**: Dynamic offer and discount management
- **Financial Management**: Settlement and commission tracking
- **Document Management**: KYC and verification systems
- **Analytics System**: Comprehensive tracking and reporting
- **Expert System**: Food expert profiles and recommendations with multi-scope support (October 2025)
- **Event Status Workflow**: Draft, coming soon, active, completed, cancelled states (October 2025)

---

## Future Enhancements

### Planned Features
1. **Enhanced Analytics**: Real-time dashboard and reporting
2. **AI Integration**: Recommendation engine and smart matching
3. **Multi-language Support**: Internationalization framework
4. **Advanced Security**: Enhanced fraud detection and prevention
5. **Mobile Optimization**: App-specific optimizations and caching
6. **Broker System**: Affiliate/broker registration and referral tracking

### Scalability Considerations
- **Partitioning**: Date-based partitioning for transaction tables
- **Caching**: Redis integration for frequently accessed data
- **CDN Integration**: Asset optimization and delivery
- **Database Optimization**: Query optimization and connection pooling
- **Expert Curation**: Expansion of expert recommendations and influencer partnerships

---

## Technical Specifications

**Database Engine:** PostgreSQL 15+ (Supabase)  
**Total Tables:** 52 (including event_occurrences, event_checkins, event_layouts, event_layout_sections)  
**Total Active Records:** 300+  
**Storage Type:** Cloud-native with automatic backups  
**Security:** Row Level Security (RLS) enabled on 28 tables  
**API:** Auto-generated REST and GraphQL APIs  
**Real-time:** Real-time subscriptions support  
**Database Triggers:** Auto-update booking check-in summary on event_checkins changes  
**Latest Features:** Section-based booking with SVG venue maps, occurrence timestamps, layout management  

---

---

## 📋 **RECOMMENDATIONS FOR EVENT BOOKING, EVENT PAYMENTS & EVENT TRANSACTIONS TABLES**

### **Event Bookings Table Recommendations**

#### **✅ Current Strengths**
1. **Comprehensive T1/T2 Tracking**: The `transaction_status` field effectively tracks dual-phase transactions
2. **Flexible Booking Types**: Supports both free and paid events with proper constraints
3. **Rich Metadata**: Includes customer details, special requests, and check-in functionality
4. **Time Management**: Proper handling of booking dates, times, and time sections

#### **🔧 Recommended Improvements**

1. **Add Booking Expiry Management**
   ```sql
   ALTER TABLE event_bookings ADD COLUMN booking_expires_at TIMESTAMPTZ;
   ALTER TABLE event_bookings ADD COLUMN auto_cancel_minutes INTEGER DEFAULT 30;
   ```

2. **Enhanced Status Tracking**
   ```sql
   -- Add more granular status options
   ALTER TABLE event_bookings DROP CONSTRAINT event_bookings_status_check;
   ALTER TABLE event_bookings ADD CONSTRAINT event_bookings_status_check 
   CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'expired'::text, 'no_show'::text]));
   ```

3. **Add Booking Source Tracking**
   ```sql
   ALTER TABLE event_bookings ADD COLUMN booking_source TEXT DEFAULT 'app';
   ALTER TABLE event_bookings ADD CONSTRAINT event_bookings_source_check 
   CHECK (booking_source = ANY (ARRAY['app'::text, 'web'::text, 'admin'::text, 'api'::text]));
   ```

4. **Add Cancellation Tracking**
   ```sql
   ALTER TABLE event_bookings ADD COLUMN cancelled_by UUID REFERENCES users(id);
   ALTER TABLE event_bookings ADD COLUMN cancellation_reason TEXT;
   ALTER TABLE event_bookings ADD COLUMN refund_amount NUMERIC DEFAULT 0;
   ```

### **Event Payments Table Recommendations**

#### **✅ Current Strengths**
1. **Excellent T1/T2 Separation**: Clear financial tracking for both transaction phases
2. **Comprehensive Fee Tracking**: Separate convenience fees and commissions for T1/T2
3. **Organizer Due Calculation**: Proper financial breakdown for settlements
4. **Status Management**: Individual status tracking for each transaction phase

#### **🔧 Recommended Improvements**

1. **Add Payment Method Tracking**
   ```sql
   ALTER TABLE event_payments ADD COLUMN t1_payment_method TEXT;
   ALTER TABLE event_payments ADD COLUMN t2_payment_method TEXT;
   ALTER TABLE event_payments ADD CONSTRAINT payment_method_check 
   CHECK (t1_payment_method = ANY (ARRAY['card'::text, 'upi'::text, 'wallet'::text, 'netbanking'::text, 'cash'::text]));
   ```

2. **Add Tax Management**
   ```sql
   ALTER TABLE event_payments ADD COLUMN t1_tax_amount NUMERIC DEFAULT 0;
   ALTER TABLE event_payments ADD COLUMN t2_tax_amount NUMERIC DEFAULT 0;
   ALTER TABLE event_payments ADD COLUMN tax_rate NUMERIC DEFAULT 0;
   ```

3. **Enhanced Refund Tracking**
   ```sql
   ALTER TABLE event_payments ADD COLUMN t1_refund_amount NUMERIC DEFAULT 0;
   ALTER TABLE event_payments ADD COLUMN t2_refund_amount NUMERIC DEFAULT 0;
   ALTER TABLE event_payments ADD COLUMN t1_refund_status TEXT DEFAULT 'none';
   ALTER TABLE event_payments ADD COLUMN t2_refund_status TEXT DEFAULT 'none';
   ```

4. **Add Payment Timestamps**
   ```sql
   ALTER TABLE event_payments ADD COLUMN t1_paid_at TIMESTAMPTZ;
   ALTER TABLE event_payments ADD COLUMN t2_paid_at TIMESTAMPTZ;
   ALTER TABLE event_payments ADD COLUMN t1_failed_at TIMESTAMPTZ;
   ALTER TABLE event_payments ADD COLUMN t2_failed_at TIMESTAMPTZ;
   ```

5. **Add Currency Support**
   ```sql
   ALTER TABLE event_payments ADD COLUMN currency TEXT DEFAULT 'INR';
   ALTER TABLE event_payments ADD COLUMN exchange_rate NUMERIC DEFAULT 1.0;
   ```

### **Event Transactions Table Recommendations**

#### **✅ Current Strengths**
1. **Gateway Integration**: Proper storage of gateway responses
2. **Purpose Categorization**: Clear transaction purpose tracking
3. **Unique Transaction IDs**: Prevents duplicate processing
4. **Comprehensive Status Management**: Full transaction lifecycle tracking

#### **🔧 Recommended Improvements**

1. **Add Transaction Phase Tracking**
   ```sql
   ALTER TABLE event_transactions ADD COLUMN transaction_phase TEXT;
   ALTER TABLE event_transactions ADD CONSTRAINT transaction_phase_check 
   CHECK (transaction_phase = ANY (ARRAY['T1'::text, 'T2'::text]));
   ```

2. **Enhanced Gateway Response Structure**
   ```sql
   ALTER TABLE event_transactions ADD COLUMN gateway_name TEXT;
   ALTER TABLE event_transactions ADD COLUMN gateway_transaction_id TEXT;
   ALTER TABLE event_transactions ADD COLUMN gateway_status TEXT;
   ALTER TABLE event_transactions ADD COLUMN gateway_error_code TEXT;
   ALTER TABLE event_transactions ADD COLUMN gateway_error_message TEXT;
   ```

3. **Add Retry Mechanism Support**
   ```sql
   ALTER TABLE event_transactions ADD COLUMN retry_count INTEGER DEFAULT 0;
   ALTER TABLE event_transactions ADD COLUMN max_retries INTEGER DEFAULT 3;
   ALTER TABLE event_transactions ADD COLUMN next_retry_at TIMESTAMPTZ;
   ```

4. **Add Transaction Metadata**
   ```sql
   ALTER TABLE event_transactions ADD COLUMN user_agent TEXT;
   ALTER TABLE event_transactions ADD COLUMN ip_address INET;
   ALTER TABLE event_transactions ADD COLUMN device_info JSONB;
   ```

5. **Add Webhook Support**
   ```sql
   ALTER TABLE event_transactions ADD COLUMN webhook_received_at TIMESTAMPTZ;
   ALTER TABLE event_transactions ADD COLUMN webhook_data JSONB;
   ALTER TABLE event_transactions ADD COLUMN webhook_verified BOOLEAN DEFAULT FALSE;
   ```

### **🚀 Advanced Recommendations**

#### **1. Add Composite Indexes for Performance**
```sql
-- Event Bookings
CREATE INDEX idx_event_bookings_user_status ON event_bookings(user_id, status);
CREATE INDEX idx_event_bookings_event_date ON event_bookings(event_id, booking_date);
CREATE INDEX idx_event_bookings_transaction_status ON event_bookings(transaction_status, status);

-- Event Payments
CREATE INDEX idx_event_payments_t1_status ON event_payments(t1_status, created_at);
CREATE INDEX idx_event_payments_t2_status ON event_payments(t2_status, created_at);
CREATE INDEX idx_event_payments_organizer_settlement ON event_payments(organizer_id, settlement_status);

-- Event Transactions
CREATE INDEX idx_event_transactions_gateway ON event_transactions(gateway_name, status);
CREATE INDEX idx_event_transactions_purpose_status ON event_transactions(purpose, status);
```

#### **2. Add Database Functions for Common Operations**
```sql
-- Function to calculate total revenue for an event
CREATE OR REPLACE FUNCTION get_event_revenue(event_uuid UUID)
RETURNS TABLE(t1_revenue NUMERIC, t2_revenue NUMERIC, total_revenue NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(t1_final_payable_amount), 0) as t1_revenue,
        COALESCE(SUM(t2_final_payable_amount), 0) as t2_revenue,
        COALESCE(SUM(customer_total_paid), 0) as total_revenue
    FROM event_payments 
    WHERE event_id = event_uuid AND (t1_status = 'paid' OR t2_status = 'paid');
END;
$$ LANGUAGE plpgsql;
```

#### **3. Add Data Validation Triggers**
```sql
-- Ensure T1/T2 amounts are consistent
CREATE OR REPLACE FUNCTION validate_t1_t2_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate that customer_total_paid equals sum of T1 and T2 amounts
    IF NEW.customer_total_paid != (COALESCE(NEW.t1_final_payable_amount, 0) + COALESCE(NEW.t2_final_payable_amount, 0)) THEN
        RAISE EXCEPTION 'customer_total_paid must equal sum of T1 and T2 final payable amounts';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_t1_t2_amounts
    BEFORE INSERT OR UPDATE ON event_payments
    FOR EACH ROW EXECUTE FUNCTION validate_t1_t2_amounts();
```

#### **4. Add Audit Trail Support**
```sql
-- Create audit table for event_payments
CREATE TABLE event_payments_audit (
    audit_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_payment_id UUID NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **📊 Monitoring & Analytics Recommendations**

1. **Add Performance Monitoring Views**
2. **Implement Transaction Success Rate Tracking**
3. **Create Revenue Analytics Functions**
4. **Add Real-time Dashboard Support**
5. **Implement Automated Reconciliation Checks**

### **🔒 Security Recommendations**

1. **Enable RLS on Event Transactions Table**
2. **Add Data Encryption for Sensitive Fields**
3. **Implement Rate Limiting for Payment Operations**
4. **Add Fraud Detection Triggers**
5. **Create Secure API Endpoints for Financial Data**

---

**Generated on:** October 29, 2025  
**Database Version:** PostgreSQL 15+ (Supabase)  
**Documentation Version:** 6.0  
**Total Tables:** 52  
**Active Records:** 300+  
**Latest Updates:** Added event_layouts and event_layout_sections for section-based booking, occurrence timestamps (Unix UTC), price_display_string for events, and enhanced user location tracking