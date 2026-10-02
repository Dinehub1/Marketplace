# DropBy - Technical Appendix

**Version**: 1.0  
**Date**: September 12, 2025  
**Repository**: DropBy-expo  
**Commit Analysis**: Latest stable version  

---

## 1. Repository Inventory & Local Development Setup

### Repository Structure
```
DropBy-expo/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Main app tabs (dining, events, orders, account)
│   ├── restaurant/        # Dynamic restaurant detail pages
│   ├── book-*/           # Booking flow pages
│   └── _layout.tsx       # Root navigation layout
├── components/           # Reusable UI components
│   └── ui/              # Core UI library (Button, Input, Card, etc.)
├── contexts/            # React contexts (AuthContext)
├── config/              # Configuration files
│   ├── supabase.js      # Supabase client and API functions
│   └── firebase.js      # Firebase auth with Expo Go compatibility
├── data/                # Mock data and types
├── utils/               # Utility functions (location, sharing)
├── assets/              # Images, fonts, and static assets
├── android/             # Android native configuration
├── ios/                 # iOS native configuration
└── docs/                # Database and API documentation
```

### Development Environment Setup

#### Prerequisites
```bash
# Required versions
Node.js: 18.x or higher
npm: 9.x or higher
Expo CLI: Latest
EAS CLI: Latest (for builds)
```

#### Installation Commands
```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd DropBy-expo
npm install

# 2. Environment setup
cp env_template.txt .env
# Edit .env with your Supabase and Firebase credentials

# 3. Start development server
npx expo start

# 4. Choose platform
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator  
# - Scan QR code for Expo Go (limited functionality)
```

#### Environment Variables Required
```bash
# .env file structure
SUPABASE_URL=https://rgaxuhdzxeewvlhgbyms.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>

# Firebase (for production builds only)
FIREBASE_API_KEY=<your-api-key>
FIREBASE_AUTH_DOMAIN=DropBy-71a85.firebaseapp.com
FIREBASE_PROJECT_ID=DropBy-71a85

# Cloudflare R2 (for image uploads)
R2_ACCOUNT_ID=<your-account-id>
R2_BUCKET=<your-bucket-name>
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_PUBLIC_BASE_URL=<your-cdn-url>
```

#### Build Configuration
```bash
# Development build (with native modules)
npx eas build --platform android --profile development
npx eas build --platform ios --profile development

# Production build
npx eas build --platform all --profile production

# Local development (Expo Go compatible)
npx expo start --tunnel
```

---

## 2. Architecture Diagrams

### High-Level System Architecture

```mermaid
graph TB
    A[Mobile App<br/>React Native + Expo] --> B[Firebase Auth]
    A --> C[Supabase Backend]
    A --> D[Cloudflare R2 CDN]
    
    B --> E[Phone Number<br/>Verification]
    
    C --> F[PostgreSQL Database<br/>29 tables]
    C --> G[Row Level Security<br/>Policies]
    C --> H[Edge Functions<br/>API Layer]
    
    F --> I[User Management]
    F --> J[Restaurant Data]
    F --> K[Booking System]
    F --> L[Event Ticketing]
    F --> M[Analytics & Logs]
    
    D --> N[Restaurant Images]
    D --> O[Event Assets]
    D --> P[Menu Photos]
    
    Q[Restaurant Owners] --> R[Business Dashboard]
    R --> C
    
    S[Admin Users] --> T[Admin Panel]
    T --> C
```

### Booking Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant A as Mobile App
    participant F as Firebase Auth
    participant S as Supabase
    participant P as Payment Gateway
    
    U->>A: Select restaurant & time
    A->>F: Verify authentication
    F-->>A: Auth token
    
    A->>S: Check slot availability
    S->>S: Query restaurant_slot_blocks
    S->>S: Query restaurant_time_capacity
    S->>S: Query existing bookings
    S-->>A: Availability response
    
    alt Slot Available
        A->>U: Show booking form
        U->>A: Fill details & confirm
        A->>S: Create pending booking
        S-->>A: Booking ID
        
        A->>P: Process payment
        P-->>A: Payment success
        
        A->>S: Update booking status to confirmed
        A->>S: Create transaction record
        S-->>A: Confirmation
        
        A->>U: Show success page
    else Slot Unavailable
        A->>U: Show alternative slots
    end
```

### Event Booking & Ticket Generation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as Mobile App
    participant S as Supabase
    participant T as Ticket System
    participant W as Wallet (Future)
    
    U->>A: Select event & tickets
    A->>S: Get event details with ticket types
    S-->>A: Event + ticket info
    
    U->>A: Choose ticket quantities
    A->>S: Check ticket availability
    S-->>A: Availability confirmed
    
    U->>A: Proceed to payment
    A->>S: Create event booking(s)
    
    loop For each ticket type
        S->>S: Generate unique ticket number
        S->>S: Create event_booking record
    end
    
    A->>S: Process payment
    S->>S: Update booking status
    S->>S: Update ticket sold quantities
    S-->>A: Booking confirmations
    
    A->>T: Generate digital tickets
    Note over W: Future: Add to Apple/Google Wallet
    
    A->>U: Show tickets & QR codes
```

---

## 3. Data Model & Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ restaurants : owns
    users ||--o{ bookings : makes
    users ||--o{ event_bookings : purchases
    users ||--o{ user_favorites : has
    users ||--o{ notifications : receives
    
    restaurants ||--o{ bookings : accepts
    restaurants ||--o{ restaurant_slot_blocks : configures
    restaurants ||--o{ restaurant_time_capacity : defines
    restaurants ||--o{ restaurant_menu_categories : organizes
    restaurants ||--o{ events : hosts
    
    events ||--o{ event_bookings : sells
    events ||--o{ event_ticket_types : offers
    events ||--|| event_guide : describes
    events ||--|| event_venue : locates
    events ||--|| event_faq_terms : informs
    events ||--|| event_prohibited_items : restricts
    events ||--o{ event_experiences : features
    events ||--o{ event_partners : sponsors
    
    event_categories ||--o{ events : categorizes
    event_ticket_types ||--o{ event_bookings : defines
    
    bookings ||--o{ transactions : generates
    event_bookings ||--o{ transactions : creates
    
    users {
        uuid id PK
        text firebase_uid UK
        text phone_number UK
        text full_name
        text role "user|business|admin"
        boolean is_verified
        jsonb notification_preferences
        timestamp created_at
        timestamp updated_at
    }
    
    restaurants {
        uuid id PK
        uuid owner_id FK
        text name
        text description
        text city
        text state
        numeric latitude
        numeric longitude
        jsonb opening_hours
        jsonb more_info
        text_array cuisines
        text_array gallery_images
        numeric rating
        integer total_reviews
        boolean is_verified
        boolean is_active
    }
    
    bookings {
        uuid id PK
        uuid user_id FK
        uuid restaurant_id FK
        date booking_date
        time booking_time
        time booking_end_time
        integer party_size
        text customer_name
        text customer_phone
        text meal_period "breakfast|lunch|dinner"
        text status "pending|confirmed|cancelled|completed|no_show"
        numeric advance_payment
        text special_requests
        timestamp created_at
    }
    
    events {
        uuid id PK
        uuid organizer_id FK
        uuid restaurant_id FK
        uuid category_id FK
        text title
        text description
        date event_date
        time start_time
        time end_time
        text cover_image_url
        text cover_video_url
        text_array gallery_images
        boolean is_active
        boolean is_featured
    }
    
    event_bookings {
        uuid id PK
        uuid user_id FK
        uuid event_id FK
        uuid ticket_id FK
        text ticket_number UK
        integer tickets_count
        numeric total_amount
        text customer_name
        text customer_phone
        text status "pending|confirmed|cancelled|refunded"
        timestamp created_at
    }
```

### Core Database Tables

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE,
    phone_number TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'business', 'admin')),
    is_verified BOOLEAN DEFAULT false,
    notification_preferences JSONB DEFAULT '{"sms": false, "push": true, "email": true}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Slot Management Tables
```sql
-- Restaurant capacity management
CREATE TABLE restaurant_time_capacity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_covers INTEGER NOT NULL CHECK (max_covers > 0),
    apply_date DATE, -- NULL = applies to all dates
    is_active BOOLEAN DEFAULT true
);

-- Slot blocking system
CREATE TABLE restaurant_slot_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    block_type TEXT NOT NULL CHECK (block_type IN ('specific_date', 'specific_time', 'meal_period', 'time_range')),
    block_date DATE,
    block_time TIME,
    meal_period TEXT CHECK (meal_period IN ('breakfast', 'lunch', 'dinner')),
    start_time TIME,
    end_time TIME,
    apply_date DATE,
    reason TEXT,
    is_active BOOLEAN DEFAULT true
);
```

### Sample Queries & Data Volumes

#### Common Query Patterns
```sql
-- 1. Check slot availability for booking
SELECT * FROM check_slot_availability(
    'restaurant-uuid',
    '2025-09-15',
    '19:30:00',
    'dinner',
    4
);

-- 2. Get trending restaurants with distance
SELECT r.*, 
       ROUND(CAST(6371 * acos(cos(radians(22.7196)) * cos(radians(latitude)) * 
       cos(radians(longitude) - radians(75.8577)) + sin(radians(22.7196)) * 
       sin(radians(latitude))) AS numeric), 2) AS distance_km
FROM restaurants r
WHERE is_active = true
ORDER BY rating DESC, total_reviews DESC
LIMIT 10;

-- 3. User booking history with restaurant details
SELECT b.*, r.name as restaurant_name, r.cover_image_url
FROM bookings b
JOIN restaurants r ON b.restaurant_id = r.id
WHERE b.user_id = 'user-uuid'
ORDER BY b.created_at DESC;

-- 4. Event analytics query
SELECT e.title, 
       COUNT(eb.id) as total_bookings,
       SUM(eb.tickets_count) as total_tickets_sold,
       SUM(eb.total_amount) as total_revenue
FROM events e
LEFT JOIN event_bookings eb ON e.id = eb.event_id
WHERE e.organizer_id = 'organizer-uuid'
  AND eb.status = 'confirmed'
GROUP BY e.id, e.title;
```

#### Current Data Volumes
- **Users**: 3 records (test data)
- **Restaurants**: 10 records (Indore-based establishments)
- **Events**: 4 records (sample events with full details)
- **Bookings**: 4 records (test bookings)
- **Event Bookings**: 7 records (test ticket purchases)
- **Total Database Size**: ~2.5MB (primarily due to JSONB content)

#### Projected Scale (12 months)
- **Users**: 50,000 records (~25MB)
- **Restaurants**: 500 records (~5MB)
- **Events**: 2,000 records (~50MB)
- **Bookings**: 100,000 records (~75MB)
- **Event Bookings**: 50,000 records (~40MB)
- **Analytics Logs**: 500,000 records (~200MB)
- **Estimated Total**: ~400MB database size

---

## 4. API Surface & Integration Points

### Supabase API Functions

#### Authentication Endpoints
```javascript
// User management functions (config/supabase.js)
export const createUser = async (userData) => { /* User creation with Firebase UID mapping */ }
export const getUserByFirebaseUid = async (firebaseUid) => { /* Fetch by auth ID */ }
export const updateUserLastLogin = async (userId) => { /* Track login activity */ }
```

#### Restaurant Management
```javascript
// Restaurant discovery
export const getRestaurants = async (filters = {}) => { /* Filter by city, cuisine, price */ }
export const getTrendingRestaurants = async (limit = 10) => { /* Top rated restaurants */ }
export const getRestaurantById = async (restaurantId) => { /* Full restaurant details */ }

// Availability checking
export const checkSlotAvailability = async (restaurantId, date, time, mealPeriod, partySize) => {
  // Returns: { status, available, reason, availableCovers, maxCovers, currentBookings }
}
```

#### Booking Management
```javascript
// Table bookings
export const createBooking = async (bookingData) => { /* Create restaurant reservation */ }
export const getUserBookings = async (userId) => { /* User's booking history */ }

// Event bookings
export const createEventBooking = async (bookingData) => { /* Purchase event tickets */ }
export const updateEventBookingStatus = async (bookingId, status) => { /* Confirm/cancel */ }
```

### Sample API Request/Response

#### Restaurant Availability Check
```javascript
// Request
const availability = await checkSlotAvailability(
  'abc123-restaurant-uuid',
  '2025-09-15',
  '19:30:00',
  'dinner',
  4
);

// Response
{
  "status": "available",
  "available": true,
  "reason": null,
  "availableCovers": 16,
  "maxCovers": 20,
  "currentBookings": 4
}
```

#### Event Booking Creation
```javascript
// Request
const booking = await createEventBooking({
  user_id: 'user-uuid',
  event_id: 'event-uuid',
  ticket_id: 'ticket-type-uuid',
  tickets_count: 2,
  total_amount: 3000,
  customer_name: 'John Doe',
  customer_phone: '+919876543210'
});

// Response
{
  "data": {
    "id": "booking-uuid",
    "ticket_number": "TKT202509150001",
    "status": "pending",
    "created_at": "2025-09-15T10:30:00Z"
  },
  "error": null
}
```

### OpenAPI Specification Stub
```yaml
openapi: 3.0.0
info:
  title: DropBy API
  version: 1.0.0
  description: Restaurant booking and event ticketing platform
  
servers:
  - url: https://rgaxuhdzxeewvlhgbyms.supabase.co/rest/v1
    description: Supabase REST API
    
paths:
  /restaurants:
    get:
      summary: List restaurants
      parameters:
        - name: city
          in: query
          schema:
            type: string
        - name: cuisine_type
          in: query
          schema:
            type: string
      responses:
        '200':
          description: List of restaurants
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Restaurant'
                  
  /bookings:
    post:
      summary: Create restaurant booking
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BookingRequest'
      responses:
        '201':
          description: Booking created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Booking'

components:
  schemas:
    Restaurant:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        cuisine_type:
          type: string
        rating:
          type: number
        is_active:
          type: boolean
```

---

## 5. Infrastructure & Deployment

### Current CI/CD Pipeline Status
**Status**: ❌ **NOT IMPLEMENTED**

**Current Process**: Manual development and testing
- Local development with `npx expo start`
- Manual builds using EAS: `npx eas build`
- No automated testing pipeline
- No automated deployment process

### Recommended CI/CD Implementation

#### GitHub Actions Workflow
```yaml
# .github/workflows/ci-cd.yml
name: DropBy CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npx expo lint
      
      - name: Run type checking
        run: npx tsc --noEmit
      
      - name: Run unit tests
        run: npm test
        
  build-preview:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build preview
        run: eas build --platform all --profile preview --non-interactive
        
  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: eas build --platform all --profile production --auto-submit
```

### Release Strategy

#### Branch Strategy
```
main (production)
├── develop (staging)
├── feature/* (feature development)
├── hotfix/* (emergency fixes)
└── release/* (release preparation)
```

#### Build Profiles (eas.json)
```json
{
  "cli": {
    "version": ">= 16.17.4",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Recommended Infrastructure Improvements

#### 1. Monitoring & Observability
```bash
# Required additions
- Sentry for error tracking
- Analytics SDK (Firebase Analytics)
- Performance monitoring
- Crash reporting
- User session recording
```

#### 2. Security Enhancements
```bash
# Security improvements needed
- Environment variable management (Expo Secure Store)
- API key rotation strategy
- SSL certificate pinning
- Code obfuscation for production builds
```

#### 3. Backup & Disaster Recovery
```bash
# Supabase backup strategy
- Daily automated database backups
- Point-in-time recovery setup
- Cross-region backup storage
- Recovery testing procedures
```

---

## 6. Security Assessment & Recommendations

### Current Security Implementation

#### Authentication & Authorization
**✅ Implemented**:
- Firebase phone number authentication
- Supabase user session management
- Role-based access control (user/business/admin)
- JWT token validation

**❌ Security Gaps**:
```javascript
// config/supabase.js:4-5 - Hardcoded credentials
const supabaseUrl = 'https://rgaxuhdzxeewvlhgbyms.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Exposed in code
```

#### Row Level Security (RLS)
**⚠️ Basic Implementation**:
```sql
-- Current RLS policy (too permissive)
CREATE POLICY "Allow all operations" ON table_name 
    FOR ALL USING (true) WITH CHECK (true);
```

**🔧 Recommended RLS Policies**:
```sql
-- Users table
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = firebase_uid);
    
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = firebase_uid);

-- Bookings table
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (
        auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id)
    );

-- Restaurants table (business users)
CREATE POLICY "Restaurant owners can manage their restaurants" ON restaurants
    FOR ALL USING (
        owner_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    );
```

### Security Vulnerabilities & Fixes

#### Critical Issues (Priority 1)
1. **Exposed Supabase Credentials** (config/supabase.js:4-5)
   ```javascript
   // ❌ Current (insecure)
   const supabaseUrl = 'https://rgaxuhdzxeewvlhgbyms.supabase.co';
   const supabaseAnonKey = 'hardcoded-key';
   
   // ✅ Recommended fix
   import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
   const supabaseUrl = SUPABASE_URL;
   const supabaseAnonKey = SUPABASE_ANON_KEY;
   ```

2. **Permissive RLS Policies** (All tables)
   - **Impact**: Unauthorized data access
   - **Fix**: Implement table-specific security policies
   - **Effort**: 3-4 person-days

3. **Firebase Configuration Exposure** (config/firebase.js:72-78)
   ```javascript
   // ❌ Exposed configuration
   export default {
     apiKey: "AIzaSyDSYAtijvkl7ZK075hyi3a7Gze8308VNvQ",
     authDomain: "DropBy-71a85.firebaseapp.com",
     // ...
   };
   ```

#### High Priority Issues (Priority 2)
1. **Missing Input Validation**
   - Location: Payment forms, booking inputs
   - Impact: SQL injection, XSS vulnerabilities
   - Fix: Implement Zod validation schemas
   - Effort: 2-3 person-days

2. **Insecure HTTP Headers**
   - Missing: CSP, HSTS, X-Frame-Options
   - Fix: Configure Supabase custom headers
   - Effort: 1 person-day

3. **Logging Sensitive Data**
   ```javascript
   // app/event-payment.tsx:83
   console.log('🔍 EventPaymentScreen - Current user:', user); // Contains PII
   ```

#### Medium Priority Issues (Priority 3)
1. **Mock Payment Processing** (app/payment.tsx, app/event-payment.tsx)
   - Currently using simulated payments
   - Need real payment gateway integration
   - Effort: 5-7 person-days

2. **Missing Rate Limiting**
   - No protection against API abuse
   - Implement Supabase rate limiting
   - Effort: 1-2 person-days

### Compliance Considerations

#### Data Protection (GDPR/CCPA)
**Current Status**: ⚠️ **Partial Compliance**
- ✅ User consent for data collection
- ❌ Missing data export functionality
- ❌ No data deletion procedures
- ❌ Missing privacy policy integration

**Required Actions**:
1. Implement user data export API
2. Add account deletion functionality
3. Create privacy policy acceptance flow
4. Add cookie consent management

#### Payment Security (PCI DSS)
**Current Status**: ❌ **Not PCI Compliant**
- Using mock payment processing
- No secure card data handling
- Missing PCI DSS assessment

**Mitigation Strategy**:
1. Integrate with PCI-compliant payment processor (Razorpay, Stripe)
2. Avoid storing any card data locally
3. Use tokenized payment methods only

---

## 7. Scalability Plan & Cost Analysis

### Supabase Cost Estimation

#### Current Usage (Development)
- **Database Size**: 2.5MB
- **Monthly Requests**: ~1,000
- **Storage**: 50MB (images)
- **Current Cost**: $0 (Free tier)

#### Projected Costs at Scale

| Metric | 10K MAU | 100K MAU | 1M MAU |
|--------|---------|----------|---------|
| **Database Size** | 400MB | 4GB | 40GB |
| **Monthly Requests** | 5M | 50M | 500M |
| **Storage** | 5GB | 50GB | 500GB |
| **Bandwidth** | 50GB | 500GB | 5TB |
| **Supabase Cost** | $25/mo | $100/mo | $2,000/mo |

#### Cost Breakdown (1M MAU Scenario)
```
Supabase Pro Plan: $25/month base
Additional Database: $40/month (40GB × $1/GB)
Additional API Requests: $1,900/month (475M × $4/1M)
Additional Storage: $100/month (475GB × $0.21/GB)
Additional Bandwidth: $2,400/month (4.5TB × $0.09/GB)

Total Monthly Cost: ~$4,465
Annual Cost: ~$53,580
Cost per MAU: $0.053/month
```

### Performance Bottlenecks & Solutions

#### Database Performance
**Current Bottlenecks**:
1. **Sequential slot availability checks** (config/supabase.js:774-839)
2. **N+1 queries in restaurant listings**
3. **Unoptimized image loading**

**Solutions**:
```sql
-- 1. Optimize slot checking with materialized views
CREATE MATERIALIZED VIEW restaurant_availability_cache AS
SELECT 
    restaurant_id,
    booking_date,
    time_slot,
    available_capacity
FROM calculate_daily_availability();

-- 2. Optimize restaurant queries with proper joins
SELECT r.*, 
       COUNT(b.id) as total_bookings,
       AVG(rev.rating) as avg_rating
FROM restaurants r
LEFT JOIN bookings b ON r.id = b.restaurant_id
LEFT JOIN reviews rev ON r.id = rev.restaurant_id
WHERE r.is_active = true
GROUP BY r.id
ORDER BY avg_rating DESC, total_bookings DESC;
```

#### API Performance Optimization
```javascript
// Implement request caching
const restaurantCache = new Map();

export const getRestaurantsWithCache = async (filters) => {
  const cacheKey = JSON.stringify(filters);
  
  if (restaurantCache.has(cacheKey)) {
    return restaurantCache.get(cacheKey);
  }
  
  const result = await getRestaurants(filters);
  restaurantCache.set(cacheKey, result);
  
  // Cache for 5 minutes
  setTimeout(() => restaurantCache.delete(cacheKey), 300000);
  
  return result;
};
```

### Migration Strategy (If Needed)

#### Scenario: Migrate from Supabase to Self-Hosted PostgreSQL
**Trigger Point**: When Supabase costs exceed $5,000/month

**Migration Steps**:
```bash
# 1. Data Export
pg_dump postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres > DropBy_backup.sql

# 2. Infrastructure Setup (AWS/GCP)
- RDS PostgreSQL instance (Multi-AZ, read replicas)
- Application Load Balancer
- ElastiCache for Redis (caching layer)
- CloudFront CDN

# 3. Application Changes
- Replace Supabase client with pg pool
- Implement custom authentication middleware
- Add Redis caching layer
- Update connection strings

# 4. Cost Comparison (1M MAU)
Self-hosted Infrastructure: ~$2,500/month
Development overhead: +$15,000/month (2 DevOps engineers)
Total: $17,500/month vs $4,465/month Supabase

Conclusion: Supabase remains cost-effective until 3M+ MAU
```

### Caching Strategy
```javascript
// Multi-layer caching approach
const cacheConfig = {
  // Level 1: In-memory (React Query)
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  
  // Level 2: AsyncStorage (mobile persistence)
  persistQueries: ['restaurants', 'user-profile'],
  
  // Level 3: CDN (Cloudflare R2)
  imageCache: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    staleWhileRevalidate: 24 * 60 * 60 // 1 day
  }
};
```

### Database Partitioning Strategy (Future)
```sql
-- Partition bookings table by date (when >10M records)
CREATE TABLE bookings_2025_q1 PARTITION OF bookings
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE bookings_2025_q2 PARTITION OF bookings
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

-- Archive old bookings to cold storage
CREATE TABLE bookings_archive (LIKE bookings);
```

---

## 8. Testing Strategy & Quality Assurance

### Current Testing Status
**Status**: ❌ **NO AUTOMATED TESTS IMPLEMENTED**

**Evidence**: No test files found (*.test.*, *.spec.*)
- No unit tests
- No integration tests  
- No E2E tests
- No testing framework configured

### Recommended Testing Implementation

#### Testing Framework Setup
```json
// package.json additions
{
  "devDependencies": {
    "@testing-library/react-native": "^12.0.0",
    "@testing-library/jest-native": "^5.4.0",
    "jest": "^29.0.0",
    "jest-expo": "^50.0.0",
    "detox": "^20.0.0",
    "@playwright/test": "^1.40.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "detox test",
    "test:e2e:build": "detox build"
  }
}
```

#### Unit Testing Strategy
```javascript
// Example: __tests__/utils/slotAvailability.test.js
import { checkSlotAvailability } from '../config/supabase';

describe('Slot Availability Tests', () => {
  test('should return available for open slots', async () => {
    const result = await checkSlotAvailability(
      'test-restaurant-id',
      '2025-09-15',
      '19:30:00',
      'dinner',
      4
    );
    
    expect(result.status).toBe('available');
    expect(result.available).toBe(true);
  });
  
  test('should handle capacity limits correctly', async () => {
    // Test capacity overflow scenarios
  });
  
  test('should respect slot blocking rules', async () => {
    // Test blocking logic
  });
});
```

#### Integration Testing for Booking Safety
```javascript
// Critical test: Prevent race conditions in booking
describe('Booking Race Conditions', () => {
  test('concurrent bookings should not exceed capacity', async () => {
    const restaurantId = 'test-restaurant';
    const dateTime = { date: '2025-09-15', time: '19:30:00' };
    
    // Simulate 10 concurrent booking attempts for 2-person tables
    const bookingPromises = Array(10).fill().map(() => 
      createBooking({
        restaurant_id: restaurantId,
        booking_date: dateTime.date,
        booking_time: dateTime.time,
        party_size: 2,
        customer_name: 'Test User',
        customer_phone: '+919999999999'
      })
    );
    
    const results = await Promise.allSettled(bookingPromises);
    const successfulBookings = results.filter(r => r.status === 'fulfilled');
    
    // Ensure capacity limits are respected
    expect(successfulBookings.length).toBeLessThanOrEqual(5); // Max 10 people
  });
});
```

#### E2E Testing for Critical User Flows
```javascript
// tests/e2e/booking-flow.spec.js (Playwright)
import { test, expect } from '@playwright/test';

test('complete restaurant booking flow', async ({ page }) => {
  // 1. Launch app and authenticate
  await page.goto('/');
  await page.waitForSelector('[data-testid="splash-screen"]');
  
  // 2. Navigate to restaurant list
  await page.tap('[data-testid="dining-tab"]');
  await page.waitForSelector('[data-testid="restaurant-list"]');
  
  // 3. Select restaurant
  await page.tap('[data-testid="restaurant-card"]:first');
  await page.waitForSelector('[data-testid="restaurant-detail"]');
  
  // 4. Book table
  await page.tap('[data-testid="book-table-button"]');
  await page.selectOption('[data-testid="party-size"]', '4');
  await page.selectOption('[data-testid="time-slot"]', '19:30');
  
  // 5. Fill booking details
  await page.fill('[data-testid="customer-name"]', 'John Doe');
  await page.fill('[data-testid="customer-phone"]', '+919876543210');
  
  // 6. Process payment
  await page.tap('[data-testid="proceed-payment"]');
  await page.tap('[data-testid="upi-payment"]');
  await page.tap('[data-testid="confirm-payment"]');
  
  // 7. Verify success
  await page.waitForSelector('[data-testid="booking-success"]');
  expect(await page.textContent('[data-testid="confirmation-message"]'))
    .toContain('Your table has been booked');
});
```

### Testing Matrix for Production

#### Critical Test Cases
| Test Category | Coverage | Priority | Automation |
|---------------|----------|----------|------------|
| **Authentication** | Phone OTP flow, session persistence | P0 | Unit + E2E |
| **Booking Safety** | Race conditions, capacity limits | P0 | Integration |
| **Payment Processing** | Payment flow, failure handling | P0 | E2E |
| **Slot Management** | Availability calculation, blocking | P1 | Unit + Integration |
| **Search & Discovery** | Restaurant filtering, location | P1 | E2E |
| **Event Ticketing** | Ticket generation, QR codes | P1 | Unit + E2E |
| **Business Dashboard** | Analytics, management features | P2 | E2E |
| **Performance** | API response times, image loading | P2 | Load testing |

#### Concurrency Testing Requirements
```javascript
// Test restaurant booking under load
const concurrencyTests = {
  // Test 1: Multiple users booking same slot
  simultaneousBookings: {
    users: 50,
    target: 'same_restaurant_time_slot',
    expectedBehavior: 'only_capacity_limit_accepted'
  },
  
  // Test 2: Event ticket purchases
  ticketRush: {
    users: 100,
    target: 'limited_ticket_event',
    expectedBehavior: 'no_overselling'
  },
  
  // Test 3: Database transaction integrity
  dataConsistency: {
    scenarios: ['concurrent_updates', 'rollback_on_failure'],
    verification: 'acid_compliance'
  }
};
```

---

## 9. Migration Plans & Contingencies

### Database Migration Strategy

#### Current State Assessment
- **Database**: Supabase (managed PostgreSQL)
- **Vendor Lock-in Risk**: Medium (standard SQL with some Supabase-specific features)
- **Data Volume**: 2.5MB (development), projected 400MB (12 months)
- **Critical Dependencies**: Row Level Security, Edge Functions, Real-time subscriptions

#### Scenario 1: Supabase to Self-Hosted PostgreSQL

**Trigger Conditions**:
- Monthly costs exceed $5,000
- Performance limitations hit
- Need for custom database extensions
- Compliance requirements for data residency

**Migration Steps**:
```bash
# Phase 1: Infrastructure Setup (Week 1-2)
1. Provision AWS RDS PostgreSQL (Multi-AZ)
   - Instance: db.r6g.2xlarge (8 vCPU, 64GB RAM)
   - Storage: 1TB GP3 with auto-scaling
   - Backup: 7-day retention, point-in-time recovery

2. Setup connection pooling (PgBouncer)
3. Configure read replicas for analytics queries
4. Implement database monitoring (CloudWatch + DataDog)

# Phase 2: Data Migration (Week 3)
1. Export Supabase schema and data
   pg_dump postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres > migration.sql

2. Schema validation and compatibility check
3. Data integrity verification
4. Performance optimization (indexes, queries)

# Phase 3: Application Updates (Week 4-5)
1. Replace Supabase client with native PostgreSQL client
2. Implement custom authentication middleware
3. Recreate RLS policies as application-level security
4. Update API endpoints and connection handling

# Phase 4: Cutover (Week 6)
1. Database replication setup
2. Blue-green deployment
3. DNS cutover with fallback
4. Post-migration validation
```

**Cost Comparison**:
```
Self-Hosted (1M MAU):
- RDS PostgreSQL: $1,200/month
- Application servers: $800/month  
- Load balancers: $300/month
- Monitoring: $200/month
- DevOps overhead: $15,000/month (2 engineers)
Total: $17,500/month

Supabase (1M MAU): $4,465/month

Decision: Remain on Supabase until 3M+ MAU
```

#### Scenario 2: Multi-Cloud Disaster Recovery

**Setup**: Primary Supabase + Secondary AWS RDS
```bash
# Real-time replication setup
1. Setup AWS Database Migration Service (DMS)
2. Configure continuous replication from Supabase to RDS
3. Implement application failover logic
4. Regular disaster recovery testing

# Failover procedure (RTO: 15 minutes, RPO: 5 minutes)
1. Detect primary database failure
2. Promote secondary RDS to primary
3. Update DNS and application configuration
4. Verify data consistency and resume operations
```

### Technology Migration Paths

#### Frontend Framework Migration
**Current**: React Native + Expo  
**Future Options**: Native iOS/Android, Flutter, React Native CLI

**React Native CLI Migration** (if Expo limitations hit):
```bash
# Migration steps (if needed in 18+ months)
1. Eject from Expo managed workflow
   npx expo eject

2. Configure native dependencies manually
3. Setup custom build pipeline
4. Implement OTA updates with CodePush
5. Add native modules for advanced features

# Effort: 4-6 weeks, Risk: Medium
```

#### Backend Service Migration
**Current**: Supabase  
**Options**: Hasura + PostgreSQL, Firebase, Custom Node.js API

**Hasura Migration Path**:
```bash
# If GraphQL API preferred over REST
1. Deploy Hasura on Docker/Kubernetes
2. Connect to existing PostgreSQL database
3. Generate GraphQL schema from tables
4. Implement custom business logic with Actions
5. Migrate client queries from REST to GraphQL

# Timeline: 8-10 weeks
# Benefits: Better type safety, real-time subscriptions
# Drawbacks: Learning curve, additional infrastructure
```

### Data Export & Backup Procedures

#### Complete Data Export Process
```sql
-- 1. Export all data with relationships
pg_dump \
  --host=db.rgaxuhdzxeewvlhgbyms.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --clean \
  --create \
  --verbose \
  --file=DropBy_complete_backup.sql

-- 2. Export specific tables for analytics
COPY (
  SELECT b.*, r.name as restaurant_name, u.phone_number
  FROM bookings b
  JOIN restaurants r ON b.restaurant_id = r.id
  JOIN users u ON b.user_id = u.id
  WHERE b.created_at >= '2024-01-01'
) TO '/tmp/bookings_export.csv' DELIMITER ',' CSV HEADER;

-- 3. Export user data for GDPR compliance
CREATE OR REPLACE FUNCTION export_user_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_profile', (SELECT row_to_json(u) FROM users u WHERE id = user_uuid),
    'bookings', (SELECT json_agg(b) FROM bookings b WHERE user_id = user_uuid),
    'event_bookings', (SELECT json_agg(eb) FROM event_bookings eb WHERE user_id = user_uuid),
    'favorites', (SELECT json_agg(f) FROM user_favorites f WHERE user_id = user_uuid),
    'reviews', (SELECT json_agg(r) FROM reviews r WHERE user_id = user_uuid)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

#### Automated Backup Strategy
```bash
#!/bin/bash
# backup-script.sh (run daily via cron)

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/DropBy"
S3_BUCKET="DropBy-backups"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_DIR/DropBy_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/DropBy_$DATE.sql

# Upload to S3 with encryption
aws s3 cp $BACKUP_DIR/DropBy_$DATE.sql.gz \
  s3://$S3_BUCKET/daily/ \
  --server-side-encryption AES256

# Cleanup local files older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

# Verify backup integrity
gunzip -t $BACKUP_DIR/DropBy_$DATE.sql.gz
if [ $? -eq 0 ]; then
  echo "Backup successful: DropBy_$DATE.sql.gz"
else
  echo "Backup failed!" | mail -s "DropBy Backup Alert" admin@DropBy.com
fi
```

### Business Continuity Plan

#### Service Level Objectives (SLOs)
- **Availability**: 99.5% uptime (3.6 hours downtime/month)
- **Response Time**: 95th percentile < 500ms
- **Data Durability**: 99.999% (5 nines)
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour

#### Incident Response Procedure
```markdown
# Severity Levels
- **P0 (Critical)**: Complete service outage
- **P1 (High)**: Core features impacted
- **P2 (Medium)**: Minor features affected
- **P3 (Low)**: Cosmetic issues

# Response Timeline
- P0: 15 minutes initial response, 4 hours resolution
- P1: 1 hour initial response, 24 hours resolution
- P2: 4 hours initial response, 72 hours resolution
- P3: Next business day response, 1 week resolution

# Communication Plan
- Status page updates every 30 minutes during incidents
- Customer notification via in-app messages
- Restaurant partner communication via WhatsApp
- Social media updates for major outages
```

---

## 10. Implementation Roadmap & Sprint Planning

### 12-Week Development Sprint Plan

The following represents a prioritized backlog of 45 high-impact tickets organized into 4 three-week sprints, designed to take the platform from current MVP state to production-ready with revenue generation capabilities.

#### Sprint 1: Foundation & Security (Weeks 1-3)
**Focus**: Production readiness, security hardening, payment integration

**Week 1: Security & Infrastructure**
- SEC-001: Implement environment variable management and remove hardcoded secrets
- SEC-002: Create production-grade RLS policies for all tables  
- SEC-003: Add input validation and sanitization across all forms
- INF-001: Setup automated backup and monitoring systems

**Week 2: Payment Integration**
- PAY-001: Integrate Razorpay payment gateway for restaurant bookings
- PAY-002: Implement event ticket payment processing with refund capability
- PAY-003: Add payment method management for users
- PAY-004: Create payment failure handling and retry logic

**Week 3: Testing & Quality**
- QA-001: Implement unit testing framework with 80% coverage target
- QA-002: Create E2E tests for critical booking flows
- QA-003: Add load testing for concurrent booking scenarios
- QA-004: Setup error tracking and performance monitoring

#### Sprint 2: Business Features & Analytics (Weeks 4-6)
**Focus**: Restaurant management tools, business analytics, admin functionality

**Week 4: Business Dashboard**
- BIZ-001: Create restaurant owner dashboard with booking analytics
- BIZ-002: Implement restaurant profile management interface
- BIZ-003: Add slot management tools (blocking, capacity control)
- BIZ-004: Build revenue reporting and export functionality

**Week 5: Advanced Restaurant Features**
- RES-001: Implement dynamic pricing for time slots and events
- RES-002: Add restaurant promotion and offer management
- RES-003: Create menu upload and categorization system
- RES-004: Implement restaurant verification workflow

**Week 6: Admin Panel & User Management**
- ADM-001: Build comprehensive admin panel for platform management
- ADM-002: Add user role management and permission controls
- ADM-003: Create restaurant approval and moderation workflows
- ADM-004: Implement dispute resolution and support ticket system

#### Sprint 3: User Experience & Engagement (Weeks 7-9)
**Focus**: User retention, discovery features, notifications

**Week 7: Enhanced Discovery**
- UX-001: Implement location-based restaurant search with maps
- UX-002: Add advanced filtering (cuisine, price, rating, distance)
- UX-003: Create personalized restaurant recommendations
- UX-004: Build event discovery and categorization system

**Week 8: User Engagement**
- ENG-001: Implement push notification system for booking reminders
- ENG-002: Add user reviews and rating system
- ENG-003: Create favorites and wishlist functionality
- ENG-004: Build referral program with incentive tracking

**Week 9: Social Features**
- SOC-001: Add social sharing for restaurants and events
- SOC-002: Implement user profile customization
- SOC-003: Create booking sharing and gift options
- SOC-004: Add follow restaurant feature with updates

#### Sprint 4: Integrations & Launch Prep (Weeks 10-12)
**Focus**: Third-party integrations, marketing tools, production deployment

**Week 10: Marketing Integrations**
- MKT-001: Implement WhatsApp Business API for booking confirmations
- MKT-002: Add email marketing integration (newsletter, promotions)
- MKT-003: Create social media auto-posting for restaurants
- MKT-004: Build affiliate tracking and commission management

**Week 11: Advanced Features**
- ADV-001: Implement wallet and loyalty points system
- ADV-002: Add group booking and event planning tools
- ADV-003: Create restaurant chat/messaging system
- ADV-004: Build waitlist management for fully booked slots

**Week 12: Launch Preparation**
- LAUNCH-001: Complete production deployment and CDN setup
- LAUNCH-002: Conduct security audit and penetration testing
- LAUNCH-003: Create user onboarding flow and tutorial
- LAUNCH-004: Setup customer support and help documentation

### Story Point Estimation & Team Allocation

#### Team Structure (Recommended)
- **Frontend Developer**: 1 senior (React Native/Expo)
- **Backend Developer**: 1 senior (Node.js/PostgreSQL)
- **QA Engineer**: 1 mid-level (Testing automation)
- **DevOps Engineer**: 0.5 (Part-time, infra management)
- **Product Manager**: 1 (Requirements, coordination)

#### Sprint Velocity Planning
- **Sprint Capacity**: 120 story points (3 weeks × 40 points/week)
- **Buffer for Bug Fixes**: 20% (24 points)
- **Net Development**: 96 story points per sprint

#### Risk Mitigation per Sprint
**Sprint 1 Risks**:
- Payment gateway integration complexity
- Security implementation delays
- **Mitigation**: Parallel payment provider evaluation, security consultant review

**Sprint 2 Risks**:
- Business requirement changes
- Complex analytics queries performance
- **Mitigation**: Weekly stakeholder reviews, database optimization focus

**Sprint 3 Risks**:
- Location services accuracy
- User engagement feature scope creep
- **Mitigation**: MVP approach, user testing validation

**Sprint 4 Risks**:
- Third-party API limitations
- Launch timeline pressure
- **Mitigation**: Early integration testing, soft launch strategy

### Success Metrics per Sprint

#### Sprint 1 Success Criteria
- ✅ All critical security vulnerabilities resolved
- ✅ Payment processing with 99.5% success rate
- ✅ Test coverage >75% for core booking flows
- ✅ Zero production incidents during deployment

#### Sprint 2 Success Criteria  
- ✅ 90% of restaurant partners actively using dashboard
- ✅ Business analytics providing actionable insights
- ✅ Admin panel handling 100% of operational tasks
- ✅ Revenue tracking accuracy within 1%

#### Sprint 3 Success Criteria
- ✅ User discovery time reduced by 40%
- ✅ Push notification engagement >25%
- ✅ User retention improved by 30%
- ✅ Average session time increased by 2 minutes

#### Sprint 4 Success Criteria
- ✅ Marketing automation driving 20% bookings
- ✅ Production system handling 1000 concurrent users
- ✅ Customer support response time <2 hours
- ✅ Platform ready for public launch announcement

This roadmap balances technical debt resolution, feature development, and business value creation while maintaining a sustainable development pace with clear deliverables and success metrics.
