# 📋 Paid Event Booking System (T1) - Complete Database Documentation

## 🎯 Overview

The DropBy platform implements a sophisticated **T1/T2 Transaction System** for paid events. This document covers the **T1 (Ticket Purchase)** phase, which handles initial ticket purchases with proper database record creation, payment processing, and transaction management.

---

## 🏗️ Database Architecture

### Core Tables Involved

| Table | Purpose | Primary Role |
|-------|---------|--------------|
| `event_bookings` | Main booking records | Stores booking details, status, and T1/T2 tracking |
| `event_payments` | Financial breakdown | Comprehensive T1/T2 financial tracking |
| `event_transactions` | Individual transactions | Gateway integration and audit trails |
| `event_tickets` | Individual ticket records | QR codes and check-in management |
| `ticket_reservations` | Temporary reservations | 10-minute hold system |

---

## 📊 Table Structures & Required Fields

### 1. `event_bookings` Table

**Purpose**: Main booking record with T1/T2 transaction status tracking

| Column | Type | Required | Description | T1 Usage |
|--------|------|----------|-------------|----------|
| `id` | uuid | ✅ | Primary key | Auto-generated |
| `user_id` | uuid | ✅ | Customer reference | From user session |
| `event_id` | uuid | ✅ | Event reference | From booking flow |
| `occurrence_id` | uuid | ✅ | Specific event occurrence | From date/time selection |
| `ticket_id` | uuid | ✅ | Ticket type reference | From ticket selection |
| `tickets_count` | integer | ✅ | Number of tickets | From quantity selection |
| `master_ticket` | text | ✅ | Master QR code | Auto-generated (BOOK-ABC123) |
| `customer_name` | text | ✅ | Customer name | From user profile |
| `customer_phone` | text | ✅ | Customer phone | From user profile |
| `customer_email` | text | ❌ | Customer email | From user profile |
| `status` | text | ✅ | Booking status | `pending` → `confirmed` |
| `booking_type` | text | ✅ | Booking type | Always `'paid'` |
| `booking_date` | date | ✅ | Event date | From occurrence |
| `booking_time` | text | ✅ | Event time | From occurrence |
| `advance_payment` | numeric | ✅ | Ticket price paid | Total ticket cost |
| `transaction_status` | text | ✅ | T1/T2 progress | `'T1'` after ticket purchase |
| `booking_end_time` | time | ✅ | Booking validity | Event start + 6 hours |
| `special_requests` | text | ❌ | Customer requests | Optional |

### 2. `event_payments` Table

**Purpose**: Comprehensive financial breakdown with T1/T2 tracking

| Column | Type | Required | Description | T1 Value |
|--------|------|----------|-------------|----------|
| `id` | uuid | ✅ | Primary key | Auto-generated |
| `event_booking_id` | uuid | ✅ | Booking reference | Links to booking |
| `user_id` | uuid | ✅ | Customer reference | From booking |
| `event_id` | uuid | ✅ | Event reference | From booking |
| `organizer_id` | uuid | ✅ | Event organizer | From events table |
| `event_type` | text | ✅ | Event category | `'paid'` |
| `status` | text | ✅ | Payment status | `'pending'` initially |
| `transaction_status` | text | ✅ | T1/T2 tracking | `'T1'` after ticket purchase |
| **T1 Financial Fields** | | | | |
| `t1_commission_amount` | numeric | ✅ | T1 commission | Calculated from ticket price |
| `t1_convenience_fee` | numeric | ✅ | T1 convenience fee | Dynamic calculation |
| `t1_organizer_due` | numeric | ✅ | T1 organizer earnings | Ticket price - commission |
| `t1_status` | text | ✅ | T1 payment status | `'paid'` after success |
| `t1_final_payable_amount` | numeric | ✅ | T1 customer payment | Ticket price + convenience fee |
| **T2 Placeholder Fields** | | | | |
| `t2_commission_amount` | numeric | ✅ | T2 commission | `0` initially |
| `t2_convenience_fee` | numeric | ✅ | T2 convenience fee | `0` initially |
| `t2_organizer_due` | numeric | ✅ | T2 organizer earnings | `0` initially |
| `t2_status` | text | ✅ | T2 payment status | `'pending'` initially |
| `t2_final_payable_amount` | numeric | ✅ | T2 customer payment | `0` initially |
| **Accumulated Fields** | | | | |
| `customer_total_paid` | numeric | ✅ | Total paid by customer | T1 amount initially |
| `commission_amount` | numeric | ✅ | Total commission | T1 commission initially |
| `convenience_fee_amount` | numeric | ✅ | Total convenience fee | T1 convenience fee initially |
| `organizer_due` | numeric | ✅ | Total organizer due | T1 organizer due initially |

### 3. `event_transactions` Table

**Purpose**: Individual transaction records for payment gateway integration

| Column | Type | Required | Description | T1 Value |
|--------|------|----------|-------------|----------|
| `id` | uuid | ✅ | Primary key | Auto-generated |
| `user_id` | uuid | ✅ | Customer reference | From booking |
| `event_booking_id` | uuid | ✅ | Booking reference | Links to booking |
| `event_payment_id` | uuid | ❌ | Payment reference | `null` for T1 |
| `amount` | numeric | ✅ | Transaction amount | Ticket price + convenience fee |
| `currency` | text | ✅ | Currency code | `'INR'` |
| `transaction_id` | text | ❌ | Gateway transaction ID | Set after payment success |
| `status` | text | ✅ | Transaction status | `'pending'` → `'success'` |
| `purpose` | text | ✅ | Transaction purpose | `'ticket_purchase'` |
| `gateway_response` | jsonb | ❌ | Payment gateway response | Set after payment |

### 4. `event_tickets` Table

**Purpose**: Individual ticket records for QR codes and check-in

| Column | Type | Required | Description | T1 Value |
|--------|------|----------|-------------|----------|
| `id` | uuid | ✅ | Primary key | Auto-generated |
| `event_booking_id` | uuid | ✅ | Booking reference | Links to booking |
| `ticket_number` | text | ✅ | Individual ticket QR | Auto-generated (TKT-XYZ789) |
| `ticket_type_id` | uuid | ✅ | Ticket type reference | From booking |
| `price` | numeric | ✅ | Individual ticket price | Price per ticket |
| `status` | text | ✅ | Ticket status | `'active'` |
| `is_checked_in` | boolean | ✅ | Check-in status | `false` |
| `checked_in_at` | timestamptz | ❌ | Check-in timestamp | `null` initially |

---

## 🔄 Complete T1 Booking Flow

### Step 1: Create Booking Record

```javascript
// Function: createPaidEventBookingWithTickets()
const bookingRecord = {
  user_id: ticketData.user_id,
  event_id: ticketData.event_id,
  occurrence_id: ticketData.occurrence_id,
  ticket_id: ticketData.ticket_id,
  tickets_count: ticketData.tickets_count,
  master_ticket: masterTicket, // BOOK-ABC123
  customer_name: ticketData.customer_name,
  customer_phone: ticketData.customer_phone,
  customer_email: ticketData.customer_email,
  status: 'pending',
  booking_type: 'paid',
  booking_date: ticketData.booking_date,
  booking_time: ticketData.booking_time,
  advance_payment: ticketData.ticket_price,
  booking_end_time: calculateEventBookingEndTime(ticketData.booking_time),
  transaction_status: 'T1' // Initially T1 only
};

INSERT INTO event_bookings VALUES (bookingRecord);
```

### Step 2: Generate Individual Tickets

```javascript
// Create individual ticket records for QR codes
for (let i = 0; i < ticketData.tickets_count; i++) {
  const ticketRecord = {
    event_booking_id: booking.id,
    ticket_number: generateTicketNumber(), // TKT-XYZ789
    ticket_type_id: ticketData.ticket_id,
    price: ticketPricePerTicket,
    status: 'active',
    is_checked_in: false
  };
  
  INSERT INTO event_tickets VALUES (ticketRecord);
}
```

### Step 3: Calculate T1 Financial Breakdown

```javascript
// Dynamic convenience fee calculation
const eventFeeSettings = await getEventFeeSettings(event_id);
const feeBreakdown = calculateEventT1Breakdown(baseTicketPrice, eventFeeSettings);

const t1Breakdown = {
  baseAmount: baseTicketPrice,
  convenienceFee: feeBreakdown.convenienceFee,
  commission: (baseTicketPrice * commissionRate) / 100,
  organizerDue: baseTicketPrice - commission,
  customerPayable: baseTicketPrice + convenienceFee
};
```

### Step 4: Create Transaction Record

```javascript
// Function: createPaidEventBooking()
const transactionData = {
  user_id: ticketData.user_id,
  event_booking_id: booking.id,
  amount: t1Breakdown.customerPayable,
  currency: 'INR',
  status: 'pending',
  purpose: 'ticket_purchase'
};

INSERT INTO event_transactions VALUES (transactionData);
```

### Step 5: Process Payment Success

```javascript
// Function: processPaidTicketPayment()
// After successful payment gateway response:

// 1. Update transaction status
UPDATE event_transactions 
SET status = 'success',
    gateway_response = paymentGatewayResponse,
    transaction_id = paymentGatewayResponse.transaction_id
WHERE id = transactionId;

// 2. Update booking status
UPDATE event_bookings 
SET status = 'confirmed'
WHERE id = transaction.event_booking_id;

// 3. Create payment record with T1 details
const paymentData = {
  event_booking_id: booking.id,
  user_id: booking.user_id,
  event_id: booking.event_id,
  organizer_id: event.organizer_id,
  event_type: 'paid',
  status: 'pending', // Will be 'paid' only after T2
  transaction_status: 'T1',
  // T1 Financial Tracking
  t1_commission_amount: t1Breakdown.commission,
  t1_convenience_fee: t1Breakdown.convenienceFee,
  t1_organizer_due: t1Breakdown.organizerDue,
  t1_status: 'paid',
  t1_final_payable_amount: t1Breakdown.customerPayable,
  // T2 Placeholders
  t2_commission_amount: 0,
  t2_convenience_fee: 0,
  t2_organizer_due: 0,
  t2_status: 'pending',
  t2_final_payable_amount: 0,
  // Accumulated Totals
  customer_total_paid: t1Breakdown.customerPayable,
  commission_amount: t1Breakdown.commission,
  convenience_fee_amount: t1Breakdown.convenienceFee,
  organizer_due: t1Breakdown.organizerDue
};

INSERT INTO event_payments VALUES (paymentData);
```

### Step 6: Confirm Reservations

```javascript
// Link reservations to confirmed booking
UPDATE ticket_reservations 
SET status = 'confirmed',
    booking_id = booking.id
WHERE user_id = user_id 
  AND event_id = event_id 
  AND status = 'active';
```

---

## 💰 Financial Calculations

### T1 Convenience Fee Calculation

```javascript
// Dynamic fee calculation based on event settings
function calculateEventT1Breakdown(ticketPrice, eventSettings) {
  let convenienceFee = 0;
  
  if (eventSettings.t1_convenience_fee_enabled) {
    if (eventSettings.t1_convenience_fee_type === 'percentage') {
      convenienceFee = (ticketPrice * eventSettings.t1_convenience_fee_value) / 100;
    } else if (eventSettings.t1_convenience_fee_type === 'flat') {
      convenienceFee = eventSettings.t1_convenience_fee_value;
    }
    
    // Apply min/max limits
    if (eventSettings.t1_min_fee_enabled) {
      convenienceFee = Math.max(convenienceFee, eventSettings.t1_min_convenience_fee);
    }
    if (eventSettings.t1_max_fee_enabled) {
      convenienceFee = Math.min(convenienceFee, eventSettings.t1_max_convenience_fee);
    }
  }
  
  return {
    baseAmount: ticketPrice,
    convenienceFee: Math.round(convenienceFee),
    totalAmount: ticketPrice + Math.round(convenienceFee)
  };
}
```

### Commission Calculation

```javascript
// Commission based on event settings
const commissionRate = event.commission_rate || 5; // Default 5%
const commissionAmount = (ticketPrice * commissionRate) / 100;
const organizerDue = ticketPrice - commissionAmount;
```

---

## 🎯 Different Event Conditions

### Condition 1: Regular Paid Event (T1 Only)

**When**: `event.transaction_mode = 'T1'`

```sql
-- Booking Status Flow
INSERT event_bookings (status = 'pending', transaction_status = 'T1')
  ↓ (Payment Success)
UPDATE event_bookings (status = 'confirmed', transaction_status = 'T1')

-- Payment Record
INSERT event_payments (
  t1_status = 'paid',
  t2_status = 'not_applicable',
  transaction_status = 'T1'
)
```

### Condition 2: Event with Venue Payment Option (T1,T2)

**When**: `event.transaction_mode = 'T1,T2'` AND `event.pay_bill_enabled = true`

```sql
-- T1 Phase (Ticket Purchase)
INSERT event_bookings (status = 'pending', transaction_status = 'T1')
  ↓ (T1 Payment Success)
UPDATE event_bookings (status = 'confirmed', transaction_status = 'T1')

-- T2 Phase (Venue Payment) - Later
UPDATE event_bookings (transaction_status = 'T1,T2')
UPDATE event_payments (
  t2_status = 'paid',
  transaction_status = 'T1,T2'
)
```

### Condition 3: Layout-Based Events (Venue Sections)

**When**: `event.booking_type = 'layout'`

```sql
-- Additional Fields for Section Tickets
INSERT event_bookings (
  section_id = selected_section_id,
  section_name = selected_section_name,
  -- ... other T1 fields
)

-- Individual tickets linked to section
INSERT event_tickets (
  section_id = selected_section_id,
  -- ... other ticket fields
)
```

### Condition 4: Events with Cover Charges

**When**: Ticket has `ticket_cover_enabled = true`

```sql
-- Modified pricing calculation
ticket_total_price = ticket.price + ticket.ticket_cover_amount
convenience_fee = calculateFee(ticket_total_price)
customer_payable = ticket_total_price + convenience_fee

-- Payment record includes cover charge tracking
INSERT event_payments (
  cover_charge = ticket.ticket_cover_amount * quantity,
  -- ... other fields
)
```

---

## 🔍 Status Tracking

### Booking Status Flow

```
pending → confirmed → completed
   ↑         ↑          ↑
  T1       T1 Paid    T2 Paid
Created   Success   (if applicable)
```

### Transaction Status Flow

```
T1 → T1,T2 (if venue payment enabled)
```

### Payment Status Flow

```
t1_status: pending → paid
t2_status: pending → paid (if applicable)
overall_status: pending → paid (after final transaction)
```

---

## 🚨 Error Handling

### Payment Failure Scenarios

```javascript
// If T1 payment fails
UPDATE event_transactions SET status = 'failed';
UPDATE event_bookings SET status = 'cancelled';
// Release reserved tickets back to inventory
```

### Reservation Expiry

```javascript
// If 10-minute reservation expires
UPDATE ticket_reservations SET status = 'expired';
// Release tickets back to available inventory
```

---

## 📝 Required Database Queries

### 1. Create Complete Paid Event Booking

```sql
-- Step 1: Insert booking
INSERT INTO event_bookings (
  user_id, event_id, occurrence_id, ticket_id, tickets_count,
  master_ticket, customer_name, customer_phone, customer_email,
  status, booking_type, booking_date, booking_time,
  advance_payment, transaction_status, booking_end_time
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'paid', $10, $11, $12, 'T1', $13);

-- Step 2: Insert individual tickets
INSERT INTO event_tickets (
  event_booking_id, ticket_number, ticket_type_id, price, status
) VALUES ($1, $2, $3, $4, 'active');

-- Step 3: Insert transaction
INSERT INTO event_transactions (
  user_id, event_booking_id, amount, currency, status, purpose
) VALUES ($1, $2, $3, 'INR', 'pending', 'ticket_purchase');
```

### 2. Process Payment Success

```sql
-- Step 1: Update transaction
UPDATE event_transactions 
SET status = 'success', gateway_response = $1, transaction_id = $2
WHERE id = $3;

-- Step 2: Update booking
UPDATE event_bookings 
SET status = 'confirmed'
WHERE id = $4;

-- Step 3: Insert payment record
INSERT INTO event_payments (
  event_booking_id, user_id, event_id, organizer_id, event_type,
  status, transaction_status, t1_commission_amount, t1_convenience_fee,
  t1_organizer_due, t1_status, t1_final_payable_amount,
  customer_total_paid, commission_amount, convenience_fee_amount, organizer_due
) VALUES ($1, $2, $3, $4, 'paid', 'pending', 'T1', $5, $6, $7, 'paid', $8, $9, $10, $11, $12);
```

### 3. Confirm Reservations

```sql
UPDATE ticket_reservations 
SET status = 'confirmed', booking_id = $1
WHERE user_id = $2 AND event_id = $3 AND status = 'active';
```

---

## 🎯 Summary

The T1 system creates a complete audit trail with:

1. **Main booking record** in `event_bookings`
2. **Individual ticket QR codes** in `event_tickets`
3. **Financial breakdown** in `event_payments`
4. **Transaction record** in `event_transactions`
5. **Reservation confirmation** in `ticket_reservations`

This ensures proper tracking for:
- ✅ Customer ticket purchases
- ✅ Financial reconciliation
- ✅ QR code generation
- ✅ Check-in management
- ✅ Commission calculations
- ✅ Audit trails
- ✅ Future T2 venue payments

The system is designed to handle all event types (regular, layout-based, with/without venue payments) while maintaining data integrity and financial accuracy.
