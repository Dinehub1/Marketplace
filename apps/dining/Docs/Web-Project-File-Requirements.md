# 🌐 Web Project - Complete Event Booking Implementation Files

## 📋 Overview

This document lists **ALL files** needed to implement the complete event booking system (Free + Paid) in your web project. The web team should use these files to understand the logic and implement it properly using a centralized `supabase.ts` file.

---

## 🎯 **CRITICAL FILES TO SHARE**

### **📁 Core Database Functions**
**File**: `config/supabase.js` ⭐ **MOST IMPORTANT**
- **Lines to Focus**: 2797-3874 (Complete T1/T2 system)
- **Key Functions**:
  - `createPaidEventBookingWithTickets()` (Lines 3236-3450)
  - `processPaidTicketPayment()` (Lines 3529-3693)
  - `createEventPayment()` (Lines 2798-2905)
  - `processSuccessfulEventPayment()` (Lines 2908-2981)
  - `createFreeEventBooking()` (Lines 2600-2740)

**Why Critical**: Contains ALL database logic for both free and paid events

---

## 📂 **COMPLETE FILE LIST BY CATEGORY**

### **🗄️ 1. Database & Backend Logic**

#### **Primary Database File**
```
📄 config/supabase.js (3,874 lines)
├── Free Event Functions (Lines 2600-2740)
│   ├── createFreeEventBooking()
│   ├── processSuccessfulEventPayment()
│   └── createEventOfferRedemption()
├── Paid Event Functions (Lines 3100-3693)
│   ├── createPaidEventBooking()
│   ├── createPaidEventBookingWithTickets()
│   ├── processPaidTicketPayment()
│   └── getTicketsForBooking()
├── Payment Functions (Lines 2798-2981)
│   ├── createEventPayment()
│   ├── processSuccessfulEventPayment()
│   └── calculateEventPaymentBreakdown()
└── Utility Functions
    ├── getEventById()
    ├── getEventOccurrences()
    ├── getEventOffers()
    └── validateEventOffer()
```

#### **Fee Calculation System**
```
📄 utils/feeCalculator.ts (245 lines)
├── calculateEventT1Breakdown() - T1 fee calculation
├── calculateEventT2Breakdown() - T2 fee calculation
├── calculateConvenienceFee() - Dynamic convenience fees
└── calculateCommission() - Commission calculation
```

#### **Reservation Management**
```
📄 utils/reservationManager.ts
├── createTicketReservation() - 10-minute ticket holds
├── cancelUserReservations() - Cancel reservations
├── confirmReservations() - Confirm after payment
├── updateReservationQuantity() - Update quantities
└── getUserEventReservations() - Get user's reservations
```

### **🎨 2. User Interface Files**

#### **Free Event Booking**
```
📄 app/booking/free/[id].tsx (1,214 lines)
├── Time slot selection logic
├── Date selection for multi-day events
├── Offer system integration
├── Event organizer display
└── Free booking confirmation flow
```

#### **Paid Event Booking**
```
📄 app/booking/paid/[id].tsx (959 lines)
├── Ticket quantity selection
├── Date/time occurrence selection
├── Reservation management integration
├── Price calculation display
└── Payment flow initiation
```

#### **Section-Based Tickets**
```
📄 app/booking/section-tickets/[id].tsx (725 lines)
├── Section-specific ticket selection
├── Venue layout integration
├── Section availability checking
└── Section-based pricing
```

#### **Venue Layout Viewer**
```
📄 app/booking/venue-layout/[id].tsx (410 lines)
├── SVG venue layout rendering
├── Interactive section selection
├── Section availability display
└── Navigation to section tickets
```

### **💳 3. Payment Processing Files**

#### **Payment Gateway Integration**
```
📄 app/events/event-payment.tsx (590 lines)
├── handleTicketPurchase() - Paid event payment
├── handleCoverChargePayment() - Free event cover charges
├── handleVenuePayment() - T2 venue payments
├── Payment method selection
└── Payment gateway integration
```

#### **Event Summary & Confirmation**
```
📄 app/events/event-summary.tsx (315 lines)
├── Free vs Paid event detection
├── Booking summary display
├── Final confirmation logic
└── Navigation to payment
```

#### **Event Confirmation**
```
📄 app/events/event-confirmation.tsx (85 lines)
├── Success confirmation display
├── Ticket details display
├── QR code generation
└── Booking completion
```

### **🧮 4. Calculation & Utility Files**

#### **Financial Calculations**
```
📄 utils/feeCalculator.ts (245 lines)
├── Dynamic convenience fee calculation
├── Commission calculation
├── T1/T2 breakdown logic
└── Min/max fee cap application
```

#### **Layout & Section Management**
```
📄 utils/layoutService.ts
├── Section availability calculation
├── Layout data processing
└── Section capacity management
```

#### **Date & Time Utilities**
```
📄 utils/dateUtils.ts
├── Event occurrence processing
├── Time slot generation
├── Date formatting
└── Timezone handling
```

### **🎫 5. Component Files**

#### **Ticket Components**
```
📄 components/Tickets/index.tsx
├── TicketCard component
├── Quantity selector
├── Price display
└── Availability status
```

#### **Event Components**
```
📄 components/Events/
├── FreeEventSummary.tsx - Free event summary
├── PaidEventSummary.tsx - Paid event summary
├── EventOrganizerCard.tsx - Organizer info
├── EventOrganizerModal.tsx - Organizer details
└── VenueLayoutViewer.tsx - Interactive venue map
```

#### **Reservation Components**
```
📄 components/ReservationTimer.tsx
├── 10-minute countdown timer
├── Expiry handling
└── Visual countdown display
```

---

## 🎯 **PRIORITY ORDER FOR WEB IMPLEMENTATION**

### **Phase 1: Core Database Functions** ⭐ **START HERE**
1. **`config/supabase.js`** - Extract ALL functions to `supabase.ts`
2. **`utils/feeCalculator.ts`** - Copy entire file
3. **`utils/reservationManager.ts`** - Copy reservation logic

### **Phase 2: Booking Flow Logic**
4. **`app/booking/free/[id].tsx`** - Free event booking logic
5. **`app/booking/paid/[id].tsx`** - Paid event booking logic
6. **`app/events/event-payment.tsx`** - Payment processing logic

### **Phase 3: UI Components**
7. **`app/events/event-summary.tsx`** - Summary page logic
8. **`components/Tickets/index.tsx`** - Ticket selection components
9. **`components/ReservationTimer.tsx`** - Timer component

### **Phase 4: Advanced Features**
10. **`app/booking/venue-layout/[id].tsx`** - Layout-based events
11. **`app/booking/section-tickets/[id].tsx`** - Section tickets
12. **`utils/layoutService.ts`** - Layout utilities

---

## 📋 **SPECIFIC FUNCTIONS TO EXTRACT**

### **From `config/supabase.js`**

#### **Free Event Functions**
```javascript
// Free Event Booking System
export const createFreeEventBooking = async (bookingData) => { /* Lines 2600-2680 */ }
export const getEventOffers = async (eventId) => { /* Lines 2681-2700 */ }
export const validateEventOffer = async (offerId, date, time, partySize) => { /* Lines 2701-2740 */ }

// Free Event Payment Processing
export const createEventPayment = async (bookingId, paymentBreakdown) => { /* Lines 2798-2905 */ }
export const processSuccessfulEventPayment = async (transactionId, response) => { /* Lines 2908-2981 */ }
```

#### **Paid Event Functions**
```javascript
// Paid Event Booking System
export const createPaidEventBookingWithTickets = async (ticketData) => { /* Lines 3236-3450 */ }
export const processPaidTicketPayment = async (transactionId, response) => { /* Lines 3529-3693 */ }
export const createPaidEventVenuePayment = async (bookingId, breakdown) => { /* Lines 3771-3874 */ }

// Ticket Management
export const getTicketsForBooking = async (bookingId) => { /* Lines 3455-3473 */ }
export const checkInTicket = async (ticketNumber) => { /* Lines 3502-3526 */ }
```

#### **Common Event Functions**
```javascript
// Event Data Retrieval
export const getEventById = async (eventId) => { /* Extract from supabase.js */ }
export const getEventOccurrences = async (eventId) => { /* Extract from supabase.js */ }
export const getOccurrenceById = async (occurrenceId) => { /* Extract from supabase.js */ }
export const getTicketsForOccurrence = async (eventId, occurrenceId) => { /* Extract from supabase.js */ }
export const getTicketsForSection = async (sectionId, occurrenceId) => { /* Extract from supabase.js */ }

// Layout & Venue Functions
export const getLayoutForOccurrence = async (occurrenceId) => { /* Extract from supabase.js */ }
export const getSectionsForLayout = async (layoutId) => { /* Extract from supabase.js */ }
```

### **From `utils/feeCalculator.ts`**
```typescript
// Fee Calculation Functions
export function calculateEventT1Breakdown(ticketAmount: number, event: any) => { /* Complete function */ }
export function calculateEventT2Breakdown(billAmount: number, event: any, discount: number, cover: number, isPaid: boolean) => { /* Complete function */ }
export function calculateConvenienceFee(amount: number, enabled: boolean, type: string, value: number, rules: any[], minEnabled: boolean, minFee: number, maxEnabled: boolean, maxFee: number) => { /* Complete function */ }
export function calculateCommission(amount: number, rate: number) => { /* Complete function */ }
```

### **From `utils/reservationManager.ts`**
```typescript
// Reservation Management Functions
export const createTicketReservation = async (userId: string, eventId: string, ticketId: string, quantity: number, occurrenceId?: string) => { /* Complete function */ }
export const cancelUserReservations = async (userId: string, eventId: string) => { /* Complete function */ }
export const confirmReservations = async (userId: string, eventId: string, bookingId: string) => { /* Complete function */ }
export const updateReservationQuantity = async (reservationId: string, newQuantity: number) => { /* Complete function */ }
export const getUserEventReservations = async (userId: string, eventId: string) => { /* Complete function */ }
export const getEarliestReservationExpiry = async (userId: string, eventId: string) => { /* Complete function */ }
```

---

## 🔄 **BOOKING FLOW LOGIC TO IMPLEMENT**

### **Free Event Flow**
```typescript
// 1. User selects date/time slot
// 2. User selects offers (optional)
// 3. Create free event booking
// 4. If cover charge exists, process T1 payment
// 5. Navigate to confirmation

const handleFreeEventBooking = async () => {
  // From app/booking/free/[id].tsx
  const bookingData = {
    user_id, event_id, occurrence_id,
    booking_date, booking_time, time_section,
    party_size, offer_id, cover_charge_per_person,
    total_cover_charge, customer_name, customer_phone
  };
  
  const result = await createFreeEventBooking(bookingData);
  
  if (coverCharge > 0) {
    // Process cover charge payment (T1)
    await processT1Payment(result.booking.id);
  }
  
  navigateToConfirmation(result.booking.id);
};
```

### **Paid Event Flow**
```typescript
// 1. User selects tickets and quantities
// 2. Create reservations (10-minute hold)
// 3. Create paid event booking with individual tickets
// 4. Process T1 payment (ticket purchase)
// 5. Confirm reservations
// 6. Navigate to confirmation

const handlePaidEventBooking = async () => {
  // From app/booking/paid/[id].tsx and app/events/event-payment.tsx
  
  // Step 1: Create reservations
  for (const ticket of selectedTickets) {
    await createTicketReservation(userId, eventId, ticket.id, ticket.quantity, occurrenceId);
  }
  
  // Step 2: Create bookings
  const bookingPromises = selectedTickets.map(ticket => {
    const ticketData = {
      user_id: userId,
      event_id: eventId,
      occurrence_id: occurrenceId,
      ticket_id: ticket.id,
      tickets_count: ticket.quantity,
      ticket_price: ticket.price * ticket.quantity,
      customer_name, customer_phone, customer_email,
      booking_date, booking_time
    };
    
    return createPaidEventBookingWithTickets(ticketData);
  });
  
  const bookingResults = await Promise.all(bookingPromises);
  
  // Step 3: Process payments
  const paymentPromises = bookingResults.map(result => {
    return processPaidTicketPayment(result.transaction.id, paymentGatewayResponse);
  });
  
  await Promise.all(paymentPromises);
  
  // Step 4: Confirm reservations
  await confirmReservations(userId, eventId, bookingResults[0].booking.id);
  
  navigateToConfirmation(bookingResults[0].booking.id);
};
```

### **Section-Based Event Flow**
```typescript
// 1. User views venue layout
// 2. User selects section
// 3. User selects tickets for that section
// 4. Same paid event flow with section info

const handleSectionEventBooking = async () => {
  // From app/booking/venue-layout/[id].tsx → app/booking/section-tickets/[id].tsx
  
  // Add section information to ticket data
  const ticketData = {
    // ... regular paid event data
    section_id: selectedSection.id,
    section_name: selectedSection.name
  };
  
  // Use same paid event flow
  await handlePaidEventBooking();
};
```

---

## 🗄️ **DATABASE SCHEMA REQUIREMENTS**

### **Tables Needed** (Copy from documentation)
1. **`event_bookings`** - Main booking records
2. **`event_payments`** - Financial breakdown with T1/T2 tracking
3. **`event_transactions`** - Individual payment transactions
4. **`event_tickets`** - Individual QR code tickets
5. **`ticket_reservations`** - 10-minute reservation system
6. **`events`** - Event details with fee settings
7. **`event_occurrences`** - Event date/time instances
8. **`event_ticket_types`** - Ticket type definitions
9. **`event_offers`** - Discount offers
10. **`event_layouts`** - Venue layout information
11. **`layout_sections`** - Venue sections

---

## 📝 **IMPLEMENTATION CHECKLIST**

### **✅ Phase 1: Setup**
- [ ] Create centralized `supabase.ts` file
- [ ] Extract all functions from `config/supabase.js`
- [ ] Copy `utils/feeCalculator.ts` completely
- [ ] Copy `utils/reservationManager.ts` completely

### **✅ Phase 2: Free Events**
- [ ] Implement free event booking logic
- [ ] Add offer system integration
- [ ] Add cover charge payment (T1)
- [ ] Test free event flow end-to-end

### **✅ Phase 3: Paid Events**
- [ ] Implement paid event booking logic
- [ ] Add reservation system (10-minute holds)
- [ ] Add T1 payment processing
- [ ] Add individual ticket generation
- [ ] Test paid event flow end-to-end

### **✅ Phase 4: Advanced Features**
- [ ] Implement venue layout system
- [ ] Add section-based ticket booking
- [ ] Add dynamic convenience fee calculation
- [ ] Test all scenarios

### **✅ Phase 5: Testing**
- [ ] Test free event booking
- [ ] Test paid event booking
- [ ] Test section-based booking
- [ ] Test payment failures and error handling
- [ ] Test reservation expiry

---

## 🚀 **FINAL RECOMMENDATION**

**Share these files in this exact order:**

1. **`docs/Complete-T1-Implementation-Guide.md`** - Complete documentation
2. **`config/supabase.js`** - ALL database functions
3. **`utils/feeCalculator.ts`** - Fee calculation system
4. **`utils/reservationManager.ts`** - Reservation system
5. **`app/booking/free/[id].tsx`** - Free event UI logic
6. **`app/booking/paid/[id].tsx`** - Paid event UI logic
7. **`app/events/event-payment.tsx`** - Payment processing
8. **`app/events/event-summary.tsx`** - Summary logic

**Tell your web team**: 
> "Extract ALL functions from these files into a centralized `supabase.ts` file. The logic is already complete - just needs to be reorganized and adapted for web framework."

This will give them **everything** needed to implement the complete booking system properly! 🎯
