# 🎯 Complete T1 Paid Event Booking Implementation Guide

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [File Structure & Responsibilities](#file-structure--responsibilities)
3. [Database Schema & Tables](#database-schema--tables)
4. [Core Implementation Files](#core-implementation-files)
5. [Scenario-Based Implementation](#scenario-based-implementation)
6. [Complete Code Flow](#complete-code-flow)
7. [Error Handling & Edge Cases](#error-handling--edge-cases)
8. [Testing & Validation](#testing--validation)

---

## 🎯 System Overview

The **T1 (Ticket Purchase)** system handles the initial phase of paid event bookings where customers purchase tickets. This is separate from T2 (Venue Payment) which handles bill payments at the venue.

### Key Characteristics:
- **T1 = Ticket Purchase** (Customer pays for entry tickets)
- **T2 = Venue Payment** (Customer pays for food/drinks at venue)
- **Financial Tracking**: Separate commission and convenience fees for T1 and T2
- **QR Code Generation**: Individual tickets with unique QR codes
- **Reservation System**: 10-minute hold on tickets during booking process

---

## 📁 File Structure & Responsibilities

### **Core Files Breakdown**

```
📦 T1 Implementation Files
├── 📄 config/supabase.js                    # Main database functions (3,500+ lines)
├── 📄 utils/feeCalculator.ts               # Dynamic fee calculations (245 lines)
├── 📄 app/events/event-payment.tsx         # Payment processing UI (590 lines)
├── 📄 app/booking/paid/[id].tsx            # Ticket selection UI (707 lines)
├── 📄 app/booking/section-tickets/[id].tsx # Section-based tickets (725 lines)
└── 📄 utils/reservationManager.ts          # Ticket reservation logic
```

### **File Responsibilities Matrix**

| File | Primary Function | T1 Role | Key Functions |
|------|------------------|---------|---------------|
| `config/supabase.js` | Database operations | **Core T1 Logic** | `createPaidEventBookingWithTickets()`, `processPaidTicketPayment()` |
| `utils/feeCalculator.ts` | Fee calculations | **Financial Logic** | `calculateEventT1Breakdown()`, `calculateConvenienceFee()` |
| `app/events/event-payment.tsx` | Payment processing | **Payment Flow** | `handleTicketPurchase()`, payment gateway integration |
| `app/booking/paid/[id].tsx` | Ticket selection | **User Interface** | Ticket quantity selection, reservation management |
| `app/booking/section-tickets/[id].tsx` | Section tickets | **Layout Events** | Section-specific ticket booking |

---

## 🗄️ Database Schema & Tables

### **1. event_bookings Table**

**Purpose**: Main booking record with T1/T2 status tracking

```sql
CREATE TABLE event_bookings (
    -- Primary Keys & References
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    event_id UUID NOT NULL REFERENCES events(id),
    occurrence_id UUID REFERENCES event_occurrences(id),
    ticket_id UUID REFERENCES event_ticket_types(id),
    
    -- Booking Details
    tickets_count INTEGER NOT NULL DEFAULT 1,
    master_ticket TEXT, -- BOOK-ABC123 (QR code for entire booking)
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    
    -- Status & Type
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    booking_type TEXT DEFAULT 'paid' CHECK (booking_type IN ('free', 'paid')),
    
    -- Financial Tracking
    gross_amount NUMERIC, -- Set in T2
    advance_payment NUMERIC, -- T1 ticket price
    final_amount NUMERIC, -- Set after T2
    
    -- T1/T2 Transaction Tracking
    transaction_status TEXT DEFAULT 'T1' CHECK (transaction_status IN ('T1', 'T1,T2')),
    
    -- Timing
    booking_date DATE NOT NULL,
    booking_time TEXT NOT NULL,
    booking_end_time TIME, -- Event start + 6 hours
    
    -- Optional Fields
    special_requests TEXT,
    
    -- Check-in Tracking
    total_checked_in INTEGER DEFAULT 0,
    all_checked_in BOOLEAN DEFAULT FALSE,
    first_check_in_at TIMESTAMPTZ,
    last_check_in_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **2. event_payments Table**

**Purpose**: Comprehensive financial breakdown with T1/T2 tracking

```sql
CREATE TABLE event_payments (
    -- Primary Keys & References
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_booking_id UUID NOT NULL REFERENCES event_bookings(id),
    user_id UUID NOT NULL REFERENCES users(id),
    event_id UUID NOT NULL REFERENCES events(id),
    organizer_id UUID NOT NULL REFERENCES users(id),
    
    -- Event Classification
    event_type TEXT NOT NULL CHECK (event_type IN ('free', 'paid')),
    
    -- Overall Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ticket_paid', 'paid', 'failed')),
    transaction_status TEXT DEFAULT 'T1' CHECK (transaction_status IN ('T1', 'T1,T2')),
    
    -- T1 Financial Fields (Ticket Purchase)
    t1_commission_amount NUMERIC DEFAULT 0,
    t1_convenience_fee NUMERIC DEFAULT 0,
    t1_organizer_due NUMERIC DEFAULT 0,
    t1_status TEXT DEFAULT 'pending' CHECK (t1_status IN ('pending', 'paid', 'failed')),
    t1_final_payable_amount NUMERIC DEFAULT 0,
    
    -- T2 Financial Fields (Venue Payment)
    t2_commission_amount NUMERIC DEFAULT 0,
    t2_convenience_fee NUMERIC DEFAULT 0,
    t2_organizer_due NUMERIC DEFAULT 0,
    t2_status TEXT DEFAULT 'pending' CHECK (t2_status IN ('pending', 'paid', 'failed')),
    t2_final_payable_amount NUMERIC DEFAULT 0,
    
    -- Accumulated Totals
    customer_total_paid NUMERIC DEFAULT 0, -- T1 + T2 total
    commission_amount NUMERIC DEFAULT 0, -- T1 + T2 commission
    convenience_fee_amount NUMERIC DEFAULT 0, -- T1 + T2 convenience fee
    organizer_due NUMERIC DEFAULT 0, -- T1 + T2 organizer due
    platform_earnings NUMERIC DEFAULT 0, -- Total platform earnings
    
    -- Additional Fields
    ticket_price NUMERIC, -- Base ticket price
    ticket_cover_amount NUMERIC DEFAULT 0, -- Cover charge per ticket
    gross_amount NUMERIC, -- T2 bill amount
    discount_amount NUMERIC DEFAULT 0,
    
    -- Rates for Audit
    commission_rate NUMERIC DEFAULT 5,
    convenience_fee_rate NUMERIC DEFAULT 5,
    
    -- Settlement
    settlement_status TEXT DEFAULT 'pending',
    settled_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **3. event_transactions Table**

**Purpose**: Individual transaction records for payment gateway integration

```sql
CREATE TABLE event_transactions (
    -- Primary Keys & References
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    event_booking_id UUID REFERENCES event_bookings(id),
    event_payment_id UUID REFERENCES event_payments(id),
    
    -- Transaction Details
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    transaction_id TEXT UNIQUE, -- Gateway transaction ID
    
    -- Status & Purpose
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    purpose TEXT NOT NULL CHECK (purpose IN ('ticket_purchase', 'cover_charge', 'venue_payment', 'refund')),
    
    -- Gateway Integration
    gateway_response JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **4. event_tickets Table**

**Purpose**: Individual ticket records for QR codes and check-in

```sql
CREATE TABLE event_tickets (
    -- Primary Keys & References
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_booking_id UUID NOT NULL REFERENCES event_bookings(id),
    ticket_type_id UUID NOT NULL REFERENCES event_ticket_types(id),
    
    -- Ticket Details
    ticket_number TEXT UNIQUE NOT NULL, -- TKT-XYZ789 (Individual QR code)
    price NUMERIC NOT NULL,
    
    -- Status & Check-in
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled')),
    is_checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 💻 Core Implementation Files

### **File 1: config/supabase.js**

**Location**: `config/supabase.js` (Lines 3236-3450)

#### **Function 1: createPaidEventBookingWithTickets()**

```javascript
/**
 * Creates paid event booking with individual ticket records (T1 - Ticket Purchase)
 * 
 * @param {Object} ticketData - Booking information
 * @param {string} ticketData.user_id - Customer ID
 * @param {string} ticketData.event_id - Event ID
 * @param {string} ticketData.occurrence_id - Specific event occurrence
 * @param {string} ticketData.ticket_id - Ticket type ID
 * @param {number} ticketData.tickets_count - Number of tickets
 * @param {number} ticketData.ticket_price - Total price for all tickets
 * @param {string} ticketData.customer_name - Customer name
 * @param {string} ticketData.customer_phone - Customer phone
 * @param {string} ticketData.customer_email - Customer email
 * @param {string} ticketData.booking_date - Event date (YYYY-MM-DD)
 * @param {string} ticketData.booking_time - Event time (HH:MM)
 * @param {string} ticketData.special_requests - Optional requests
 * 
 * @returns {Object} { data: { booking, tickets, transaction }, error }
 */
export const createPaidEventBookingWithTickets = async (ticketData) => {
  try {
    console.log('🎫 Creating paid event booking with individual tickets:', ticketData);
    console.log('📅 Occurrence ID:', ticketData.occurrence_id);
    console.log('🎟️ Tickets Count:', ticketData.tickets_count);
    
    // ========================================
    // STEP 1: Generate Master Ticket Number
    // ========================================
    const { data: masterTicket, error: masterError } = await supabase
      .rpc('generate_master_ticket_number');
    
    if (masterError) {
      console.error('❌ Error generating master ticket:', masterError);
      throw masterError;
    }
    
    console.log('📋 Master Ticket Generated:', masterTicket);
    
    // Calculate booking end time (event start + 6 hours)
    const bookingEndTime = calculateEventBookingEndTime(ticketData.booking_time);
    
    // ========================================
    // STEP 2: Create Parent Booking Record
    // ========================================
    const bookingRecord = {
      user_id: ticketData.user_id,
      event_id: ticketData.event_id,
      occurrence_id: ticketData.occurrence_id || null,
      ticket_id: ticketData.ticket_id,
      tickets_count: ticketData.tickets_count,
      master_ticket: masterTicket,
      gross_amount: null, // Will be set in T2
      customer_name: ticketData.customer_name,
      customer_phone: ticketData.customer_phone,
      customer_email: ticketData.customer_email,
      status: 'pending',
      booking_type: 'paid',
      booking_date: ticketData.booking_date,
      booking_time: ticketData.booking_time,
      time_section: null, // Not used for paid events
      party_size: null, // Not used for paid events
      special_requests: ticketData.special_requests || null,
      offer_id: null, // Not used for paid events
      cover_charge_per_person: null, // Not used for paid events
      total_cover_charge: null, // Not used for paid events
      final_amount: null, // Will be set after T2
      advance_payment: ticketData.ticket_price, // Full ticket price
      booking_end_time: bookingEndTime,
      transaction_status: 'T1', // Initially T1 only
      total_checked_in: 0,
      all_checked_in: false,
      first_check_in_at: null,
      last_check_in_at: null
    };

    const { data: booking, error: bookingError } = await supabase
      .from('event_bookings')
      .insert([bookingRecord])
      .select()
      .single();
    
    if (bookingError) {
      console.error('❌ Error creating parent booking:', bookingError);
      throw bookingError;
    }
    
    console.log('✅ Parent booking created:', booking.id);
    console.log('✅ Master Ticket:', booking.master_ticket);
    console.log('✅ Linked to occurrence:', booking.occurrence_id);
    
    // ========================================
    // STEP 3: Generate Individual Ticket Records
    // ========================================
    const individualTickets = [];
    const ticketPricePerTicket = parseFloat(ticketData.ticket_price) / ticketData.tickets_count;
    
    console.log('🎟️ Creating individual tickets:', {
      totalPrice: ticketData.ticket_price,
      ticketCount: ticketData.tickets_count,
      pricePerTicket: ticketPricePerTicket
    });
    
    for (let i = 0; i < ticketData.tickets_count; i++) {
      // Generate unique ticket number for each ticket
      const { data: ticketNumber, error: ticketError } = await supabase
        .rpc('generate_ticket_number');
      
      if (ticketError) {
        console.error('❌ Error generating ticket number:', ticketError);
        throw ticketError;
      }
      
      const ticketRecord = {
        event_booking_id: booking.id,
        ticket_number: ticketNumber,
        ticket_type_id: ticketData.ticket_id,
        price: ticketPricePerTicket,
        status: 'active',
        is_checked_in: false,
        checked_in_at: null
      };
      
      individualTickets.push(ticketRecord);
      console.log(`🎫 Ticket ${i + 1}/${ticketData.tickets_count}: ${ticketNumber}`);
    }
    
    // Insert all individual tickets
    const { data: createdTickets, error: ticketsError } = await supabase
      .from('event_tickets')
      .insert(individualTickets)
      .select();
    
    if (ticketsError) {
      console.error('❌ Error creating individual tickets:', ticketsError);
      throw ticketsError;
    }
    
    console.log('✅ Individual tickets created:', createdTickets.length);
    
    // ========================================
    // STEP 4: Get Event Fee Settings & Calculate T1 Amount
    // ========================================
    const { data: eventFeeSettings, error: feeError } = await supabase
      .from('events')
      .select(`
        commission_rate,
        t1_convenience_fee_enabled,
        t1_convenience_fee_type,
        t1_convenience_fee_value,
        t1_convenience_fee_rules,
        t1_min_fee_enabled,
        t1_min_convenience_fee,
        t1_max_fee_enabled,
        t1_max_convenience_fee
      `)
      .eq('id', ticketData.event_id)
      .single();
    
    if (feeError) {
      console.error('❌ Error fetching event fee settings:', feeError);
      throw feeError;
    }
    
    // Use dynamic fee calculator
    const { calculateEventT1Breakdown } = require('../utils/feeCalculator');
    const baseTicketPrice = parseFloat(ticketData.ticket_price);
    const feeBreakdown = calculateEventT1Breakdown(baseTicketPrice, eventFeeSettings);
    
    const convenienceFee = feeBreakdown.convenienceFee;
    const totalAmount = baseTicketPrice + convenienceFee;
    
    console.log('💰 T1 Transaction calculation (Dynamic):', {
      baseTicketPrice,
      convenienceFee,
      convenienceFeeRate: eventFeeSettings.t1_convenience_fee_value,
      totalAmount
    });
    
    // ========================================
    // STEP 5: Create Transaction Record
    // ========================================
    const transactionData = {
      user_id: ticketData.user_id,
      event_booking_id: booking.id,
      amount: totalAmount, // Include convenience fee in transaction amount
      currency: 'INR',
      status: 'pending',
      purpose: 'ticket_purchase'
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('event_transactions')
      .insert([transactionData])
      .select()
      .single();
    
    if (transactionError) {
      console.error('❌ Error creating transaction:', transactionError);
      throw transactionError;
    }
    
    console.log('✅ Transaction created:', transaction.id);
    console.log('💰 Transaction amount:', transaction.amount);
    
    console.log('🎉 Complete booking created successfully!');
    console.log('📊 Summary:', {
      booking_id: booking.id,
      master_ticket: booking.master_ticket,
      individual_tickets: createdTickets.length,
      transaction_id: transaction.id
    });
    
    return { 
      data: { 
        booking,
        tickets: createdTickets,
        transaction 
      }, 
      error: null 
    };
    
  } catch (error) {
    console.error('❌ Error creating booking with individual tickets:', error);
    return { data: null, error };
  }
};
```

#### **Function 2: processPaidTicketPayment()**

```javascript
/**
 * Process successful paid ticket payment (T1)
 * Updates transaction status, booking status, and creates payment record
 * 
 * @param {string} transactionId - Transaction ID to update
 * @param {Object} paymentGatewayResponse - Payment gateway response
 * @param {string} paymentGatewayResponse.transaction_id - Gateway transaction ID
 * @param {string} paymentGatewayResponse.payment_method - Payment method used
 * @param {string} paymentGatewayResponse.payment_status - Payment status
 * @param {number} paymentGatewayResponse.amount - Payment amount
 * 
 * @returns {Object} { data: { transaction, payment }, error }
 */
export const processPaidTicketPayment = async (transactionId, paymentGatewayResponse) => {
  try {
    console.log('🎉 Processing successful paid ticket payment:', transactionId);
    
    // ========================================
    // STEP 1: Update Transaction Status
    // ========================================
    const { data: transaction, error: transactionError } = await supabase
      .from('event_transactions')
      .update({
        status: 'success',
        gateway_response: paymentGatewayResponse,
        transaction_id: paymentGatewayResponse.transaction_id || `TXN_${Date.now()}`
      })
      .eq('id', transactionId)
      .select()
      .single();
    
    if (transactionError) throw transactionError;

    // ========================================
    // STEP 2: Update Booking Status to Confirmed
    // ========================================
    const { error: bookingError } = await supabase
      .from('event_bookings')
      .update({ 
        status: 'confirmed'
      })
      .eq('id', transaction.event_booking_id);
    
    if (bookingError) throw bookingError;

    // ========================================
    // STEP 3: Get Booking & Event Details for Payment Record
    // ========================================
    const { data: bookingDetails } = await supabase
      .from('event_bookings')
      .select(`
        *,
        events!inner(
          organizer_id,
          commission_rate,
          t1_convenience_fee_enabled,
          t1_convenience_fee_type,
          t1_convenience_fee_value,
          t1_convenience_fee_rules,
          t1_min_fee_enabled,
          t1_min_convenience_fee,
          t1_max_fee_enabled,
          t1_max_convenience_fee
        )
      `)
      .eq('id', transaction.event_booking_id)
      .single();

    // Get ticket details to check if it has cover charge
    const { data: ticketDetails } = await supabase
      .from('event_ticket_types')
      .select('*')
      .eq('id', bookingDetails.ticket_id)
      .single();

    // ========================================
    // STEP 4: Calculate T1 Financial Details
    // ========================================
    const eventFeeSettings = bookingDetails.events;
    const feeRate = eventFeeSettings.t1_convenience_fee_value ?? 5;
    
    // Calculate T1 financial details for ticket purchase
    const totalPaidAmount = transaction.amount;
    
    // Calculate actual base price using the event's fee rate
    const convenienceFeeEnabled = eventFeeSettings.t1_convenience_fee_enabled || false;
    const baseTicketPrice = convenienceFeeEnabled 
      ? totalPaidAmount / (1 + feeRate / 100)
      : totalPaidAmount;
    
    // Only include cover amount if ticket_cover_enabled is true
    const ticketCoverAmount = (ticketDetails?.ticket_cover_enabled && ticketDetails?.ticket_cover_amount) 
      ? parseFloat(ticketDetails.ticket_cover_amount) * bookingDetails.tickets_count
      : 0;
    
    // Use dynamic fee calculator
    const { calculateEventT1Breakdown } = require('../utils/feeCalculator');
    const breakdown = calculateEventT1Breakdown(baseTicketPrice, eventFeeSettings);
    
    const convenienceFeeT1 = breakdown.convenienceFee;
    const commissionT1 = breakdown.commission;
    const organizerDueT1 = breakdown.organizerGets;
    const platformEarningsT1 = breakdown.platformEarns;
    const commissionRate = eventFeeSettings.commission_rate ?? 5;

    console.log('💰 T1 Payment calculations:', {
      totalPaidAmount,
      baseTicketPrice,
      ticketsCount: bookingDetails.tickets_count,
      ticketCoverPerUnit: ticketDetails?.ticket_cover_amount,
      ticketCoverAmount,
      convenienceFeeT1,
      convenienceFeeRate: feeRate,
      commissionT1,
      commissionRate,
      organizerDueT1,
      platformEarningsT1,
      ticketCoverEnabled: ticketDetails?.ticket_cover_enabled
    });

    // ========================================
    // STEP 5: Create Payment Record with T1 Details
    // ========================================
    const paymentData = {
      event_booking_id: transaction.event_booking_id,
      user_id: transaction.user_id,
      event_id: bookingDetails.event_id,
      organizer_id: bookingDetails.events.organizer_id,
      event_type: 'paid',
      ticket_price: baseTicketPrice, // Base ticket price without convenience fee
      cover_charge: null, // Not used for paid events
      convenience_fee_rate: feeRate, // Dynamic fee rate from database
      convenience_fee_amount: convenienceFeeT1, // Dynamically calculated convenience fee (T1 only)
      gross_amount: null, // Will be set in T2
      t1_final_payable_amount: totalPaidAmount, // T1 payment amount
      commission_rate: commissionRate, // Dynamic commission rate from database
      commission_amount: commissionT1, // Dynamically calculated commission (T1 only)
      organizer_due: organizerDueT1, // Base ticket price minus commission (T1 only)
      platform_earnings: platformEarningsT1, // Commission + convenience fee from T1
      payment_id: paymentGatewayResponse.transaction_id,
      status: 'ticket_paid', // Special status indicating T1 complete, T2 pending
      settlement_status: 'pending',
      settled_at: null,
      ticket_cover_amount: ticketCoverAmount, // Cover portion of ticket (0 if not enabled)
      discount_amount: null, // Not used for now
      transaction_status: 'T1', // This is T1 (ticket purchase)
      // New T1/T2 tracking columns
      t1_commission_amount: commissionT1, // T1 commission
      t2_commission_amount: 0, // T2 not completed yet
      t1_convenience_fee: convenienceFeeT1, // T1 convenience fee
      t2_convenience_fee: 0, // T2 not completed yet
      customer_total_paid: totalPaidAmount, // T1 payment amount
      t1_organizer_due: organizerDueT1, // T1 organizer due
      t2_organizer_due: 0, // T2 not completed yet
      t1_status: 'paid', // T1 is paid
      t2_status: 'pending', // T2 is pending
      t2_final_payable_amount: 0 // T2 not completed yet
    };

    const { data: payment, error: paymentError } = await supabase
      .from('event_payments')
      .insert([paymentData])
      .select()
      .single();
    
    if (paymentError) throw paymentError;

    // ========================================
    // STEP 6: Link Transaction to Payment Record
    // ========================================
    const { error: transactionUpdateError } = await supabase
      .from('event_transactions')
      .update({ event_payment_id: payment.id })
      .eq('id', transactionId);
    
    if (transactionUpdateError) {
      console.error('Error linking transaction to payment:', transactionUpdateError);
      // Don't throw error here as the main payment is successful
    }

    console.log('✅ Paid ticket payment processed successfully');
    return { data: { transaction, payment }, error: null };
  } catch (error) {
    console.error('Error processing paid ticket payment:', error);
    return { data: null, error };
  }
};
```

### **File 2: utils/feeCalculator.ts**

**Location**: `utils/feeCalculator.ts` (Lines 102-148)

#### **Function: calculateEventT1Breakdown()**

```typescript
/**
 * Complete payment breakdown for events T1 (ticket purchase)
 * Calculates convenience fee, commission, and financial distribution
 * 
 * @param {number} ticketAmount - Base ticket price
 * @param {Object} event - Event settings with fee configuration
 * @param {boolean} event.t1_convenience_fee_enabled - Whether T1 convenience fee is enabled
 * @param {string} event.t1_convenience_fee_type - Fee type ('percentage' or 'dynamic')
 * @param {number} event.t1_convenience_fee_value - Fee percentage or base value
 * @param {Array} event.t1_convenience_fee_rules - Dynamic fee rules array
 * @param {boolean} event.t1_min_fee_enabled - Whether minimum fee is enabled
 * @param {number} event.t1_min_convenience_fee - Minimum fee amount
 * @param {boolean} event.t1_max_fee_enabled - Whether maximum fee is enabled
 * @param {number} event.t1_max_convenience_fee - Maximum fee amount
 * @param {number} event.commission_rate - Commission percentage
 * 
 * @returns {Object} Financial breakdown object
 */
export function calculateEventT1Breakdown(
  ticketAmount: number,
  event: any
): {
  ticketAmount: number;
  convenienceFee: number;
  commission: number;
  customerPays: number;
  organizerGets: number;
  platformEarns: number;
  feeRate: number;
} {
  console.log('\n🎫 === EVENT T1 (TICKET PURCHASE) BREAKDOWN ===');
  console.log('📋 Ticket Amount:', ticketAmount);

  // Calculate convenience fee using dynamic rules
  const convenienceFee = calculateConvenienceFee(
    ticketAmount,
    event.t1_convenience_fee_enabled || false,
    event.t1_convenience_fee_type || 'percentage',
    event.t1_convenience_fee_value ?? 5,
    event.t1_convenience_fee_rules || [],
    event.t1_min_fee_enabled || false,
    event.t1_min_convenience_fee ?? 0,
    event.t1_max_fee_enabled || false,
    event.t1_max_convenience_fee ?? 0
  );

  // Calculate commission
  const commissionRate = event.commission_rate ?? 5;
  const commission = calculateCommission(ticketAmount, commissionRate);

  const breakdown = {
    ticketAmount,
    convenienceFee,
    commission,
    customerPays: ticketAmount + convenienceFee,
    organizerGets: ticketAmount - commission,
    platformEarns: convenienceFee + commission,
    feeRate: event.t1_convenience_fee_value ?? 5
  };

  console.log('💳 Customer Pays:', breakdown.customerPays);
  console.log('👤 Organizer Gets:', breakdown.organizerGets);
  console.log('🏦 Platform Earns:', breakdown.platformEarns);
  console.log('===========================================\n');

  return breakdown;
}
```

#### **Function: calculateConvenienceFee()**

```typescript
/**
 * Calculate convenience fee based on dynamic rules
 * Supports percentage and dynamic slab-based calculations
 * 
 * @param {number} amount - Base amount for fee calculation
 * @param {boolean} enabled - Whether convenience fee is enabled
 * @param {string} feeType - 'percentage' or 'dynamic'
 * @param {number} feeValue - Fee percentage or base value
 * @param {Array} feeRules - Dynamic fee rules for slab-based calculation
 * @param {boolean} minEnabled - Whether minimum fee cap is enabled
 * @param {number} minFee - Minimum fee amount
 * @param {boolean} maxEnabled - Whether maximum fee cap is enabled
 * @param {number} maxFee - Maximum fee amount
 * 
 * @returns {number} Calculated convenience fee
 */
export function calculateConvenienceFee(
  amount: number,
  enabled: boolean,
  feeType: 'percentage' | 'dynamic',
  feeValue: number,
  feeRules: ConvenienceFeeRule[],
  minEnabled: boolean,
  minFee: number,
  maxEnabled: boolean,
  maxFee: number
): number {
  // If convenience fee is disabled, return 0
  if (!enabled) {
    console.log('💰 Convenience fee disabled, returning 0');
    return 0;
  }

  let calculatedFee = 0;

  if (feeType === 'percentage') {
    // Simple percentage calculation
    calculatedFee = (amount * feeValue) / 100;
    console.log(`💰 Percentage fee: ${amount} × ${feeValue}% = ₹${calculatedFee}`);
  } else if (feeType === 'dynamic') {
    // Find matching rule from dynamic slabs
    const matchingRule = feeRules.find(rule => 
      amount >= rule.min && (rule.max === null || amount < rule.max)
    );
    
    if (matchingRule) {
      if (matchingRule.type === 'percentage') {
        calculatedFee = (amount * matchingRule.value) / 100;
        console.log(`💰 Dynamic slab fee: ${amount} × ${matchingRule.value}% = ₹${calculatedFee}`);
      }
    } else {
      console.log('💰 No matching dynamic rule found for amount:', amount);
    }
  }

  // Apply minimum fee cap if enabled
  if (minEnabled && calculatedFee < minFee) {
    console.log(`💰 Applying min cap: ₹${calculatedFee} → ₹${minFee}`);
    calculatedFee = minFee;
  }

  // Apply maximum fee cap if enabled
  if (maxEnabled && calculatedFee > maxFee) {
    console.log(`💰 Applying max cap: ₹${calculatedFee} → ₹${maxFee}`);
    calculatedFee = maxFee;
  }

  // Round to 2 decimal places
  const roundedFee = Math.round(calculatedFee * 100) / 100;
  console.log(`💰 Final convenience fee: ₹${roundedFee}`);
  return roundedFee;
}
```

### **File 3: app/events/event-payment.tsx**

**Location**: `app/events/event-payment.tsx` (Lines 260-408)

#### **Function: handleTicketPurchase()**

```typescript
/**
 * Handle ticket purchase process for paid events
 * Creates bookings, processes payments, and updates reservations
 */
const handleTicketPurchase = async () => {
  if (!user?.id) {
    Alert.alert('Authentication Required', 'Please log in to purchase tickets');
    return;
  }

  if (!selectedPaymentMethod) {
    Alert.alert('Payment Method Required', 'Please select a payment method');
    return;
  }

  try {
    setIsProcessing(true);
    console.log('🎫 Starting ticket purchase process...');
    console.log('🎫 Event ID:', eventId);
    console.log('🎫 Occurrence ID:', occurrenceId);
    console.log('🎫 Tickets to purchase:', tickets);

    console.log('🎫 Creating paid event bookings for tickets:', tickets);
    
    // ========================================
    // STEP 1: Create Booking Records for Each Ticket Type
    // ========================================
    const bookingPromises = tickets.map(async (ticket: any) => {
      const ticketData = {
        user_id: user.id,
        event_id: eventId,
        occurrence_id: occurrenceId || null,  // Add occurrence ID
        ticket_id: ticket.id,
        tickets_count: ticket.quantity,
        ticket_price: ticket.price * ticket.quantity,
        customer_name: user.full_name || user.phone_number,
        customer_phone: user.phone_number,
        customer_email: user.email,
        booking_date: eventDate || new Date().toISOString().split('T')[0],
        booking_time: eventTime || new Date().toTimeString().slice(0, 5),
        special_requests: null
      };

      console.log('📝 Creating paid event booking with individual tickets:', ticketData);
      console.log('📅 Occurrence ID for paid booking:', occurrenceId);
      console.log('🎟️ Creating', ticket.quantity, 'individual tickets');
      
      // Use function that creates individual ticket records
      const bookingResult = await createPaidEventBookingWithTickets(ticketData);
      if (bookingResult.error) {
        console.error('❌ Paid booking creation error:', bookingResult.error);
        throw new Error(`Failed to create paid booking: ${JSON.stringify(bookingResult.error)}`);
      }
      console.log('✅ Paid event booking created:', bookingResult.data.booking.id);
      console.log('✅ Master Ticket:', bookingResult.data.booking.master_ticket);
      console.log('✅ Individual Tickets:', bookingResult.data.tickets.length);
      console.log('🎫 Ticket Numbers:', bookingResult.data.tickets.map(t => t.ticket_number).join(', '));
      return bookingResult.data;
    });

    const bookingResults = await Promise.all(bookingPromises);
    console.log('✅ All paid event bookings created:', bookingResults);
    
    // ========================================
    // STEP 2: Process Payments for Each Booking
    // ========================================
    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    console.log('💳 Processing paid ticket payments with method:', selectedMethod?.name);
    
    const paymentPromises = bookingResults.map(async (result) => {
      const { booking, transaction } = result;
      
      // Mock payment gateway response (replace with real gateway integration)
      const paymentGatewayResponse = {
        transaction_id: `TXN${Date.now()}_${booking.id.slice(0, 8)}`,
        payment_method: selectedMethod?.name,
        payment_type: selectedMethod?.type,
        payment_status: 'success',
        transaction_time: new Date().toISOString(),
        amount: transaction.amount,
        currency: 'INR',
        mock_payment: true
      };

      console.log('💰 Processing paid ticket payment for transaction:', transaction.id);
      const paymentResult = await processPaidTicketPayment(transaction.id, paymentGatewayResponse);
      if (paymentResult.error) {
        console.error('❌ Paid ticket payment error:', paymentResult.error);
        throw new Error(`Failed to process paid ticket payment: ${JSON.stringify(paymentResult.error)}`);
      }
      console.log('✅ Paid ticket payment processed:', paymentResult.data);
      return { booking, paymentResult: paymentResult.data };
    });

    const paymentResults = await Promise.all(paymentPromises);
    console.log('✅ All paid ticket payments processed successfully');

    // ========================================
    // STEP 3: Update Ticket Sold Quantities
    // ========================================
    console.log('🎫 Updating ticket sold quantities...');
    const ticketUpdatePromises = tickets.map((ticket: any) => 
      updateTicketSoldQuantity(ticket.id, ticket.quantity)
    );
    await Promise.all(ticketUpdatePromises);
    console.log('✅ All ticket quantities updated');

    // ========================================
    // STEP 4: Confirm Reservations
    // ========================================
    console.log('✅ Confirming ticket reservations...');
    try {
      const firstBooking = paymentResults[0]?.booking;
      if (firstBooking && user?.id && eventId) {
        const confirmResult = await confirmReservations(user.id, eventId as string, firstBooking.id);
        if (confirmResult.success) {
          console.log('✅ Reservations confirmed and linked to booking');
        } else {
          console.error('⚠️ Failed to confirm reservations:', confirmResult.error);
        }
      }
    } catch (reservationError) {
      console.error('⚠️ Error confirming reservations:', reservationError);
      // Don't fail the entire process for reservation confirmation errors
    }

    // ========================================
    // STEP 5: Navigate to Confirmation
    // ========================================
    const firstResult = paymentResults[0];
    const confirmationParams = {
      bookingId: firstResult.booking.id,
      eventId: eventId,
      eventTitle: eventTitle,
      eventImage: eventImage,
      totalAmount: getTotalAmount().toString(),
      ticketCount: getTotalTickets().toString(),
      paymentMethod: selectedMethod?.name || 'Unknown',
      bookingStatus: 'confirmed'
    };

    console.log('🎉 Ticket purchase completed successfully!');
    console.log('📊 Final Summary:', {
      bookings_created: paymentResults.length,
      total_tickets: getTotalTickets(),
      total_amount: getTotalAmount(),
      master_tickets: paymentResults.map(r => r.booking.master_ticket)
    });

    // Navigate to confirmation screen
    router.replace({
      pathname: '/events/event-confirmation',
      params: confirmationParams
    });

  } catch (error) {
    console.error('❌ Ticket purchase failed:', error);
    Alert.alert(
      'Purchase Failed', 
      error instanceof Error ? error.message : 'An unexpected error occurred during ticket purchase'
    );
  } finally {
    setIsProcessing(false);
  }
};
```

---

## 🎭 Scenario-Based Implementation

### **Scenario 1: Regular Paid Event Tickets**

**Use Case**: Customer buys 2 tickets for a concert at ₹500 each

**Flow**:
1. **User Interface**: `app/booking/paid/[id].tsx`
2. **Payment Processing**: `app/events/event-payment.tsx`
3. **Database Operations**: `config/supabase.js`
4. **Fee Calculation**: `utils/feeCalculator.ts`

**Code Example**:
```javascript
// Input data
const ticketData = {
  user_id: "user-123",
  event_id: "event-456",
  occurrence_id: "occ-789",
  ticket_id: "ticket-type-101",
  tickets_count: 2,
  ticket_price: 1000, // ₹500 × 2 tickets
  customer_name: "John Doe",
  customer_phone: "+91 9876543210",
  customer_email: "john@example.com",
  booking_date: "2024-12-25",
  booking_time: "19:00",
  special_requests: null
};

// Fee calculation (5% convenience fee)
const feeBreakdown = calculateEventT1Breakdown(1000, {
  t1_convenience_fee_enabled: true,
  t1_convenience_fee_type: 'percentage',
  t1_convenience_fee_value: 5,
  commission_rate: 5
});

// Result:
// ticketAmount: 1000
// convenienceFee: 50
// commission: 50
// customerPays: 1050
// organizerGets: 950
// platformEarns: 100
```

**Database Records Created**:
```sql
-- event_bookings
INSERT INTO event_bookings (
  user_id, event_id, occurrence_id, ticket_id,
  tickets_count, master_ticket, customer_name,
  customer_phone, status, booking_type,
  advance_payment, transaction_status
) VALUES (
  'user-123', 'event-456', 'occ-789', 'ticket-type-101',
  2, 'BOOK-ABC123', 'John Doe',
  '+91 9876543210', 'pending', 'paid',
  1000, 'T1'
);

-- event_tickets (2 records)
INSERT INTO event_tickets (
  event_booking_id, ticket_number, ticket_type_id, price, status
) VALUES 
  ('booking-id', 'TKT-XYZ001', 'ticket-type-101', 500, 'active'),
  ('booking-id', 'TKT-XYZ002', 'ticket-type-101', 500, 'active');

-- event_transactions
INSERT INTO event_transactions (
  user_id, event_booking_id, amount, currency, status, purpose
) VALUES (
  'user-123', 'booking-id', 1050, 'INR', 'pending', 'ticket_purchase'
);
```

### **Scenario 2: Tickets with Cover Charges**

**Use Case**: Restaurant event with ₹300 ticket + ₹200 cover charge per person

**Special Logic**: Cover charges are tracked separately but included in total price

**Code Example**:
```javascript
// Ticket type configuration
const ticketType = {
  id: "ticket-type-102",
  name: "VIP Dinner Entry",
  price: 300, // Base ticket price
  ticket_cover_enabled: true,
  ticket_cover_amount: 200 // Cover charge per ticket
};

// Total price calculation
const basePrice = ticketType.price; // 300
const coverCharge = ticketType.ticket_cover_amount; // 200
const totalTicketPrice = basePrice + coverCharge; // 500 per ticket

// For 2 tickets
const ticketData = {
  ticket_price: totalTicketPrice * 2, // 1000 (₹500 × 2)
  tickets_count: 2
};

// Fee calculation on total amount
const feeBreakdown = calculateEventT1Breakdown(1000, eventSettings);

// Cover charge tracking in payment record
const ticketCoverAmount = ticketType.ticket_cover_amount * 2; // 400
```

**Payment Record**:
```javascript
const paymentData = {
  ticket_price: 600, // Base price (₹300 × 2)
  ticket_cover_amount: 400, // Cover charges (₹200 × 2)
  t1_final_payable_amount: 1050, // Total with convenience fee
  // ... other fields
};
```

### **Scenario 3: Section-Based Tickets (Layout Events)**

**Use Case**: Stadium event with different sections (VIP, General, etc.)

**Flow**:
1. **Venue Layout**: `app/booking/venue-layout/[id].tsx`
2. **Section Selection**: User clicks on "VIP Section"
3. **Section Tickets**: `app/booking/section-tickets/[id].tsx`
4. **Same T1 Flow**: Uses same core functions

**Code Example**:
```javascript
// Navigation from venue layout to section tickets
const handleSectionPress = (section) => {
  router.push({
    pathname: `/booking/section-tickets/${event.id}`,
    params: {
      occurrenceId: occurrenceId,
      sectionId: section.id,
      sectionName: section.name, // "VIP Section"
      eventTitle: event.title,
      eventImage: event.cover_image_url,
      eventVenue: event.venue,
      eventDate: occurrence?.occurrence_date,
      eventTime: event.start_time,
    },
  });
};

// In section tickets page
const selectedTicketDetails = {
  id: ticketId,
  name: ticket.name,
  price: ticket.price,
  quantity: count,
  section_name: sectionName, // Additional field for sections
  section_id: sectionId, // Additional field for sections
};
```

### **Scenario 4: Events with Dynamic Convenience Fees**

**Use Case**: Event with slab-based convenience fees

**Configuration**:
```javascript
const eventSettings = {
  t1_convenience_fee_enabled: true,
  t1_convenience_fee_type: 'dynamic',
  t1_convenience_fee_rules: [
    { min: 0, max: 500, type: 'percentage', value: 3 },      // 3% for ₹0-499
    { min: 500, max: 1000, type: 'percentage', value: 4 },   // 4% for ₹500-999
    { min: 1000, max: null, type: 'percentage', value: 5 }   // 5% for ₹1000+
  ],
  t1_min_fee_enabled: true,
  t1_min_convenience_fee: 10, // Minimum ₹10
  t1_max_fee_enabled: true,
  t1_max_convenience_fee: 100 // Maximum ₹100
};
```

**Fee Calculation**:
```javascript
// For ₹800 ticket
const amount = 800;
const matchingRule = eventSettings.t1_convenience_fee_rules.find(rule => 
  amount >= rule.min && (rule.max === null || amount < rule.max)
);
// matchingRule = { min: 500, max: 1000, type: 'percentage', value: 4 }

const calculatedFee = (800 * 4) / 100; // 32
// Apply min/max caps: Math.max(32, 10) = 32, Math.min(32, 100) = 32
// Final fee: ₹32
```

### **Scenario 5: Events with Discounts/Offers**

**Use Case**: Event with 20% discount offer

**Note**: Discounts are typically applied in T2 (venue payment), but can affect T1 in some cases

**Code Example**:
```javascript
// Discount calculation (usually in T2)
const calculateEventPaymentBreakdown = (grossBillAmount, offer, coverCharge) => {
  let discountAmount = 0;
  
  if (offer) {
    if (offer.discount_type === 'percentage') {
      discountAmount = (grossBillAmount * offer.discount_value) / 100;
    } else if (offer.discount_type === 'flat') {
      discountAmount = offer.discount_value;
    } else if (offer.discount_type === 'bogo') {
      // Buy One Get One - 50% discount
      discountAmount = grossBillAmount * 0.5;
    }
  }
  
  const afterDiscount = grossBillAmount - discountAmount;
  const convenienceFee = Math.round(afterDiscount * 0.05);
  const finalPayable = Math.max(0, afterDiscount - coverCharge + convenienceFee);
  
  return {
    grossBillAmount,
    discountAmount,
    afterDiscount,
    coverCharge,
    convenienceFee,
    finalPayable
  };
};
```

---

## 🔄 Complete Code Flow

### **Flow Diagram**

```
📱 User Interface Layer
├── app/booking/paid/[id].tsx (Ticket Selection)
├── app/booking/section-tickets/[id].tsx (Section Tickets)
└── app/booking/venue-layout/[id].tsx (Venue Layout)
    ↓
💳 Payment Processing Layer  
└── app/events/event-payment.tsx (Payment Gateway)
    ↓
🧮 Calculation Layer
└── utils/feeCalculator.ts (Fee Calculations)
    ↓
🗄️ Database Layer
└── config/supabase.js (Database Operations)
    ↓
📊 Database Tables
├── event_bookings (Main booking record)
├── event_tickets (Individual QR codes)
├── event_transactions (Payment records)
└── event_payments (Financial breakdown)
```

### **Step-by-Step Execution**

#### **Step 1: User Selects Tickets**
**File**: `app/booking/paid/[id].tsx` or `app/booking/section-tickets/[id].tsx`

```typescript
// User selects ticket quantities
const handleTicketQuantityChange = async (ticketId: string, newQuantity: number) => {
  // Create or update reservation
  const result = await createTicketReservation(
    user.id,
    event.id,
    ticketId,
    newQuantity,
    occurrenceId
  );
  
  // Update UI state
  setSelectedTickets(prev => ({
    ...prev,
    [ticketId]: newQuantity
  }));
};

// User clicks "Continue"
const handleContinue = () => {
  router.push({
    pathname: '/events/event-summary',
    params: {
      eventId: event.id,
      ticketDetails: JSON.stringify(selectedTicketDetails),
      totalAmount: getTotalAmount().toString(),
      // ... other params
    }
  });
};
```

#### **Step 2: Payment Processing**
**File**: `app/events/event-payment.tsx`

```typescript
const handleTicketPurchase = async () => {
  // 1. Create bookings for each ticket type
  const bookingPromises = tickets.map(async (ticket) => {
    const ticketData = {
      user_id: user.id,
      event_id: eventId,
      occurrence_id: occurrenceId,
      ticket_id: ticket.id,
      tickets_count: ticket.quantity,
      ticket_price: ticket.price * ticket.quantity,
      // ... other fields
    };
    
    return await createPaidEventBookingWithTickets(ticketData);
  });
  
  const bookingResults = await Promise.all(bookingPromises);
  
  // 2. Process payments
  const paymentPromises = bookingResults.map(async (result) => {
    const paymentGatewayResponse = {
      transaction_id: `TXN${Date.now()}`,
      payment_status: 'success',
      amount: result.transaction.amount,
      // ... other gateway fields
    };
    
    return await processPaidTicketPayment(
      result.transaction.id, 
      paymentGatewayResponse
    );
  });
  
  await Promise.all(paymentPromises);
  
  // 3. Update quantities and confirm reservations
  // 4. Navigate to confirmation
};
```

#### **Step 3: Database Operations**
**File**: `config/supabase.js`

```javascript
export const createPaidEventBookingWithTickets = async (ticketData) => {
  // 1. Generate master ticket number
  const { data: masterTicket } = await supabase.rpc('generate_master_ticket_number');
  
  // 2. Create main booking record
  const bookingRecord = {
    user_id: ticketData.user_id,
    event_id: ticketData.event_id,
    occurrence_id: ticketData.occurrence_id,
    ticket_id: ticketData.ticket_id,
    tickets_count: ticketData.tickets_count,
    master_ticket: masterTicket,
    status: 'pending',
    booking_type: 'paid',
    advance_payment: ticketData.ticket_price,
    transaction_status: 'T1',
    // ... other fields
  };
  
  const { data: booking } = await supabase
    .from('event_bookings')
    .insert([bookingRecord])
    .select()
    .single();
  
  // 3. Create individual ticket records
  const individualTickets = [];
  const ticketPricePerTicket = ticketData.ticket_price / ticketData.tickets_count;
  
  for (let i = 0; i < ticketData.tickets_count; i++) {
    const { data: ticketNumber } = await supabase.rpc('generate_ticket_number');
    
    individualTickets.push({
      event_booking_id: booking.id,
      ticket_number: ticketNumber,
      ticket_type_id: ticketData.ticket_id,
      price: ticketPricePerTicket,
      status: 'active'
    });
  }
  
  const { data: createdTickets } = await supabase
    .from('event_tickets')
    .insert(individualTickets)
    .select();
  
  // 4. Calculate fees and create transaction
  const { data: eventFeeSettings } = await supabase
    .from('events')
    .select('t1_convenience_fee_enabled, t1_convenience_fee_value, commission_rate')
    .eq('id', ticketData.event_id)
    .single();
  
  const feeBreakdown = calculateEventT1Breakdown(ticketData.ticket_price, eventFeeSettings);
  const totalAmount = ticketData.ticket_price + feeBreakdown.convenienceFee;
  
  const transactionData = {
    user_id: ticketData.user_id,
    event_booking_id: booking.id,
    amount: totalAmount,
    currency: 'INR',
    status: 'pending',
    purpose: 'ticket_purchase'
  };
  
  const { data: transaction } = await supabase
    .from('event_transactions')
    .insert([transactionData])
    .select()
    .single();
  
  return {
    data: { booking, tickets: createdTickets, transaction },
    error: null
  };
};
```

#### **Step 4: Payment Success Processing**
**File**: `config/supabase.js`

```javascript
export const processPaidTicketPayment = async (transactionId, paymentGatewayResponse) => {
  // 1. Update transaction status
  const { data: transaction } = await supabase
    .from('event_transactions')
    .update({
      status: 'success',
      gateway_response: paymentGatewayResponse,
      transaction_id: paymentGatewayResponse.transaction_id
    })
    .eq('id', transactionId)
    .select()
    .single();
  
  // 2. Update booking status
  await supabase
    .from('event_bookings')
    .update({ status: 'confirmed' })
    .eq('id', transaction.event_booking_id);
  
  // 3. Get booking and event details
  const { data: bookingDetails } = await supabase
    .from('event_bookings')
    .select(`
      *,
      events!inner(organizer_id, commission_rate, t1_convenience_fee_value)
    `)
    .eq('id', transaction.event_booking_id)
    .single();
  
  // 4. Calculate financial breakdown
  const feeBreakdown = calculateEventT1Breakdown(
    transaction.amount, 
    bookingDetails.events
  );
  
  // 5. Create payment record
  const paymentData = {
    event_booking_id: transaction.event_booking_id,
    user_id: transaction.user_id,
    event_id: bookingDetails.event_id,
    organizer_id: bookingDetails.events.organizer_id,
    event_type: 'paid',
    status: 'ticket_paid',
    transaction_status: 'T1',
    // T1 Financial Fields
    t1_commission_amount: feeBreakdown.commission,
    t1_convenience_fee: feeBreakdown.convenienceFee,
    t1_organizer_due: feeBreakdown.organizerGets,
    t1_status: 'paid',
    t1_final_payable_amount: transaction.amount,
    // T2 Placeholder Fields
    t2_commission_amount: 0,
    t2_convenience_fee: 0,
    t2_organizer_due: 0,
    t2_status: 'pending',
    t2_final_payable_amount: 0,
    // Accumulated Totals
    customer_total_paid: transaction.amount,
    commission_amount: feeBreakdown.commission,
    convenience_fee_amount: feeBreakdown.convenienceFee,
    organizer_due: feeBreakdown.organizerGets,
    platform_earnings: feeBreakdown.platformEarns
  };
  
  const { data: payment } = await supabase
    .from('event_payments')
    .insert([paymentData])
    .select()
    .single();
  
  // 6. Link transaction to payment
  await supabase
    .from('event_transactions')
    .update({ event_payment_id: payment.id })
    .eq('id', transactionId);
  
  return { data: { transaction, payment }, error: null };
};
```

#### **Step 5: Fee Calculation**
**File**: `utils/feeCalculator.ts`

```typescript
export function calculateEventT1Breakdown(ticketAmount: number, event: any) {
  // 1. Calculate convenience fee
  const convenienceFee = calculateConvenienceFee(
    ticketAmount,
    event.t1_convenience_fee_enabled || false,
    event.t1_convenience_fee_type || 'percentage',
    event.t1_convenience_fee_value ?? 5,
    event.t1_convenience_fee_rules || [],
    event.t1_min_fee_enabled || false,
    event.t1_min_convenience_fee ?? 0,
    event.t1_max_fee_enabled || false,
    event.t1_max_convenience_fee ?? 0
  );
  
  // 2. Calculate commission
  const commissionRate = event.commission_rate ?? 5;
  const commission = calculateCommission(ticketAmount, commissionRate);
  
  // 3. Return breakdown
  return {
    ticketAmount,
    convenienceFee,
    commission,
    customerPays: ticketAmount + convenienceFee,
    organizerGets: ticketAmount - commission,
    platformEarns: convenienceFee + commission,
    feeRate: event.t1_convenience_fee_value ?? 5
  };
}

export function calculateConvenienceFee(
  amount: number,
  enabled: boolean,
  feeType: 'percentage' | 'dynamic',
  feeValue: number,
  feeRules: ConvenienceFeeRule[],
  minEnabled: boolean,
  minFee: number,
  maxEnabled: boolean,
  maxFee: number
): number {
  if (!enabled) return 0;
  
  let calculatedFee = 0;
  
  if (feeType === 'percentage') {
    calculatedFee = (amount * feeValue) / 100;
  } else if (feeType === 'dynamic') {
    const matchingRule = feeRules.find(rule => 
      amount >= rule.min && (rule.max === null || amount < rule.max)
    );
    
    if (matchingRule && matchingRule.type === 'percentage') {
      calculatedFee = (amount * matchingRule.value) / 100;
    }
  }
  
  // Apply min/max caps
  if (minEnabled && calculatedFee < minFee) {
    calculatedFee = minFee;
  }
  if (maxEnabled && calculatedFee > maxFee) {
    calculatedFee = maxFee;
  }
  
  return Math.round(calculatedFee * 100) / 100;
}
```

---

## 🚨 Error Handling & Edge Cases

### **Payment Failure Handling**

```javascript
// In processPaidTicketPayment()
export const processPaidTicketPayment = async (transactionId, paymentGatewayResponse) => {
  try {
    // ... success logic
  } catch (error) {
    console.error('❌ Payment processing failed:', error);
    
    // Update transaction status to failed
    await supabase
      .from('event_transactions')
      .update({ 
        status: 'failed',
        gateway_response: { error: error.message }
      })
      .eq('id', transactionId);
    
    // Update booking status to cancelled
    const { data: transaction } = await supabase
      .from('event_transactions')
      .select('event_booking_id')
      .eq('id', transactionId)
      .single();
    
    if (transaction) {
      await supabase
        .from('event_bookings')
        .update({ status: 'cancelled' })
        .eq('id', transaction.event_booking_id);
    }
    
    return { data: null, error: error.message };
  }
};
```

### **Reservation Expiry Handling**

```javascript
// In reservation system
export const handleReservationExpiry = async (userId: string, eventId: string) => {
  console.log('⏰ Handling reservation expiry for user:', userId);
  
  // Cancel expired reservations
  const { error } = await supabase
    .from('ticket_reservations')
    .update({ status: 'expired' })
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString());
  
  if (error) {
    console.error('❌ Error expiring reservations:', error);
  } else {
    console.log('✅ Expired reservations cleaned up');
  }
};
```

### **Insufficient Ticket Availability**

```javascript
// In createTicketReservation()
export const createTicketReservation = async (
  userId: string,
  eventId: string,
  ticketTypeId: string,
  quantity: number,
  occurrenceId?: string
) => {
  try {
    // Check available capacity
    const { data: ticketType } = await supabase
      .from('event_ticket_types')
      .select('capacity_total, capacity_booked')
      .eq('id', ticketTypeId)
      .single();
    
    const availableCapacity = ticketType.capacity_total - ticketType.capacity_booked;
    
    if (quantity > availableCapacity) {
      return {
        success: false,
        error: `Only ${availableCapacity} tickets available. You requested ${quantity}.`
      };
    }
    
    // Create reservation
    const reservationData = {
      user_id: userId,
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      quantity: quantity,
      occurrence_id: occurrenceId,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      status: 'active'
    };
    
    const { data: reservation, error } = await supabase
      .from('ticket_reservations')
      .insert([reservationData])
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data: reservation };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### **Duplicate Booking Prevention**

```javascript
// In createPaidEventBookingWithTickets()
export const createPaidEventBookingWithTickets = async (ticketData) => {
  try {
    // Check for existing pending booking
    const { data: existingBooking } = await supabase
      .from('event_bookings')
      .select('id, status')
      .eq('user_id', ticketData.user_id)
      .eq('event_id', ticketData.event_id)
      .eq('occurrence_id', ticketData.occurrence_id)
      .eq('status', 'pending')
      .single();
    
    if (existingBooking) {
      return {
        data: null,
        error: 'You already have a pending booking for this event. Please complete or cancel it first.'
      };
    }
    
    // ... rest of booking creation logic
  } catch (error) {
    return { data: null, error: error.message };
  }
};
```

---

## 🧪 Testing & Validation

### **Unit Tests for Fee Calculator**

```typescript
// tests/feeCalculator.test.ts
import { calculateEventT1Breakdown, calculateConvenienceFee } from '../utils/feeCalculator';

describe('Fee Calculator', () => {
  test('should calculate percentage convenience fee correctly', () => {
    const result = calculateConvenienceFee(
      1000, // amount
      true, // enabled
      'percentage', // type
      5, // value (5%)
      [], // rules
      false, // minEnabled
      0, // minFee
      false, // maxEnabled
      0 // maxFee
    );
    
    expect(result).toBe(50); // 5% of 1000
  });
  
  test('should apply minimum fee cap', () => {
    const result = calculateConvenienceFee(
      100, // amount
      true, // enabled
      'percentage', // type
      2, // value (2%)
      [], // rules
      true, // minEnabled
      10, // minFee
      false, // maxEnabled
      0 // maxFee
    );
    
    expect(result).toBe(10); // 2% of 100 = 2, but min is 10
  });
  
  test('should calculate complete T1 breakdown', () => {
    const eventSettings = {
      t1_convenience_fee_enabled: true,
      t1_convenience_fee_type: 'percentage',
      t1_convenience_fee_value: 5,
      commission_rate: 5
    };
    
    const result = calculateEventT1Breakdown(1000, eventSettings);
    
    expect(result.ticketAmount).toBe(1000);
    expect(result.convenienceFee).toBe(50);
    expect(result.commission).toBe(50);
    expect(result.customerPays).toBe(1050);
    expect(result.organizerGets).toBe(950);
    expect(result.platformEarns).toBe(100);
  });
});
```

### **Integration Tests for Booking Flow**

```typescript
// tests/bookingFlow.test.ts
import { createPaidEventBookingWithTickets, processPaidTicketPayment } from '../config/supabase';

describe('Booking Flow', () => {
  test('should create complete booking with tickets and transaction', async () => {
    const ticketData = {
      user_id: 'test-user-123',
      event_id: 'test-event-456',
      occurrence_id: 'test-occ-789',
      ticket_id: 'test-ticket-101',
      tickets_count: 2,
      ticket_price: 1000,
      customer_name: 'Test User',
      customer_phone: '+91 9876543210',
      customer_email: 'test@example.com',
      booking_date: '2024-12-25',
      booking_time: '19:00'
    };
    
    const result = await createPaidEventBookingWithTickets(ticketData);
    
    expect(result.error).toBeNull();
    expect(result.data.booking).toBeDefined();
    expect(result.data.tickets).toHaveLength(2);
    expect(result.data.transaction).toBeDefined();
    expect(result.data.booking.status).toBe('pending');
    expect(result.data.booking.booking_type).toBe('paid');
  });
  
  test('should process payment successfully', async () => {
    // First create a booking
    const bookingResult = await createPaidEventBookingWithTickets(ticketData);
    const transactionId = bookingResult.data.transaction.id;
    
    const paymentGatewayResponse = {
      transaction_id: 'TXN123456789',
      payment_method: 'Credit Card',
      payment_status: 'success',
      amount: 1050
    };
    
    const paymentResult = await processPaidTicketPayment(transactionId, paymentGatewayResponse);
    
    expect(paymentResult.error).toBeNull();
    expect(paymentResult.data.transaction.status).toBe('success');
    expect(paymentResult.data.payment).toBeDefined();
    expect(paymentResult.data.payment.t1_status).toBe('paid');
  });
});
```

### **Database Validation Queries**

```sql
-- Validate booking integrity
SELECT 
  b.id as booking_id,
  b.master_ticket,
  b.tickets_count,
  COUNT(t.id) as actual_tickets,
  b.advance_payment,
  tr.amount as transaction_amount,
  p.t1_final_payable_amount as payment_amount
FROM event_bookings b
LEFT JOIN event_tickets t ON t.event_booking_id = b.id
LEFT JOIN event_transactions tr ON tr.event_booking_id = b.id
LEFT JOIN event_payments p ON p.event_booking_id = b.id
WHERE b.booking_type = 'paid'
GROUP BY b.id, tr.id, p.id
HAVING COUNT(t.id) != b.tickets_count; -- Find mismatches

-- Validate financial consistency
SELECT 
  p.id as payment_id,
  p.t1_commission_amount + p.t1_convenience_fee as t1_platform_earnings,
  p.platform_earnings,
  p.t1_organizer_due + p.t2_organizer_due as total_organizer_due,
  p.organizer_due,
  p.customer_total_paid,
  p.t1_final_payable_amount + p.t2_final_payable_amount as calculated_total
FROM event_payments p
WHERE p.transaction_status = 'T1'
  AND (
    p.t1_commission_amount + p.t1_convenience_fee != p.platform_earnings
    OR p.customer_total_paid != p.t1_final_payable_amount
  ); -- Find financial inconsistencies
```

---

## 📋 Summary

This comprehensive guide covers the complete T1 implementation with:

### **✅ Core Components**
- **4 main files** with detailed code examples
- **4 database tables** with complete schemas
- **5 different scenarios** with specific implementations
- **Complete error handling** and edge cases
- **Testing strategies** and validation queries

### **🎯 Key Features**
- **Dynamic fee calculation** based on event settings
- **Individual ticket QR codes** for each purchase
- **Comprehensive financial tracking** with T1/T2 separation
- **Reservation system** with 10-minute holds
- **Multi-scenario support** (regular, cover charges, sections, discounts)

### **📁 Files to Copy for Web Project**
1. `config/supabase.js` - Functions: `createPaidEventBookingWithTickets()`, `processPaidTicketPayment()`
2. `utils/feeCalculator.ts` - Complete file with all fee calculation functions
3. `app/events/event-payment.tsx` - Function: `handleTicketPurchase()` (adapt for web)

This implementation ensures **complete T1 functionality** with proper database records, financial tracking, and error handling for all paid event booking scenarios! 🚀
