/**
 * Dynamic Fee Calculator
 * Handles convenience fees and commissions for events and restaurants
 */

export interface ConvenienceFeeRule {
  min: number;
  max: number | null;
  type: 'percentage';
  value: number;
}

export interface FeeCalculationParams {
  amount: number;
  enabled: boolean;
  feeType: 'percentage' | 'dynamic';
  feeValue: number;
  feeRules: ConvenienceFeeRule[];
  minEnabled: boolean;
  minFee: number;
  maxEnabled: boolean;
  maxFee: number;
}

/**
 * Calculate convenience fee based on dynamic rules
 * Convenience Fee = Customer pays EXTRA on top of base amount → Platform keeps
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

/**
 * Calculate commission (deducted from merchant/organizer)
 * Commission = Deducted FROM base amount → Platform keeps
 */
export function calculateCommission(
  amount: number,
  commissionRate: number
): number {
  const commission = Math.round((amount * commissionRate / 100) * 100) / 100;
  console.log(`📊 Commission: ${amount} × ${commissionRate}% = ₹${commission}`);
  return commission;
}

/**
 * Complete payment breakdown for events T1 (ticket purchase)
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

/**
 * Complete payment breakdown for events T2 (venue bill)
 */
export function calculateEventT2Breakdown(
  billAmount: number,
  event: any,
  discountAmount: number = 0,
  coverAmount: number = 0,
  isPaidEvent: boolean = false
): {
  billAmount: number;
  coverAmount: number;
  discountAmount: number;
  afterCoverAndDiscount: number;
  convenienceFee: number;
  commission: number;
  customerPays: number;
  organizerGets: number;
  platformEarns: number;
  feeRate: number;
} {
  console.log('\n🍽️ === EVENT T2 (VENUE BILL) BREAKDOWN ===');
  console.log('📋 Event Type:', isPaidEvent ? 'PAID' : 'FREE');
  console.log('📋 Bill Amount:', billAmount);
  console.log('🎫 Cover Amount (Already Paid):', coverAmount);
  console.log('💳 Discount:', discountAmount);

  // ✅ Calculate base amount after discount
  const afterDiscount = Math.max(0, billAmount - discountAmount);
  console.log('💰 After Discount:', afterDiscount);

  // ✅ DIFFERENT LOGIC FOR PAID VS FREE EVENTS:
  let convenienceFeeBase: number;
  let commissionBase: number;
  let afterCoverAndDiscount: number;

  if (isPaidEvent && coverAmount > 0) {
    // 🎟️ PAID EVENT with ticket_cover_amount:
    // 1. Deduct cover FIRST (customer's prepaid credit)
    // 2. Calculate BOTH commission AND convenience fee on remaining amount
    afterCoverAndDiscount = Math.max(0, afterDiscount - coverAmount);
    convenienceFeeBase = afterCoverAndDiscount;
    commissionBase = afterCoverAndDiscount; // ✅ Commission on net bill (after cover)
    console.log('🎟️ PAID EVENT: Deduct cover first, then calculate fees');
    console.log('💵 Net Amount (after cover & discount):', afterCoverAndDiscount);
    console.log('💵 Commission Base (net bill):', commissionBase);
  } else {
    // 🎫 FREE EVENT with cover_charge:
    // 1. Calculate convenience fee on (Bill - Discount) FIRST
    // 2. Calculate commission on (Bill - Discount)
    // 3. Then deduct cover from customer payment only
    convenienceFeeBase = afterDiscount;
    commissionBase = afterDiscount; // ✅ Commission on gross bill (before cover)
    afterCoverAndDiscount = Math.max(0, afterDiscount - coverAmount);
    console.log('🎫 FREE EVENT: Calculate fees first, then deduct cover');
    console.log('💵 Commission Base (gross bill):', commissionBase);
    console.log('💵 After Cover & Discount (customer pays):', afterCoverAndDiscount);
  }

  // ✅ Calculate convenience fee on appropriate base
  const convenienceFee = calculateConvenienceFee(
    convenienceFeeBase,
    event.t2_convenience_fee_enabled || false,
    event.t2_convenience_fee_type || 'percentage',
    event.t2_convenience_fee_value ?? 5,
    event.t2_convenience_fee_rules || [],
    event.t2_min_fee_enabled || false,
    event.t2_min_convenience_fee ?? 0,
    event.t2_max_fee_enabled || false,
    event.t2_max_convenience_fee ?? 0
  );

  // ✅ Calculate commission on appropriate base (depends on event type)
  const commissionRate = event.commission_rate ?? 5;
  const commission = calculateCommission(commissionBase, commissionRate);

  const breakdown = {
    billAmount,
    coverAmount,
    discountAmount,
    afterCoverAndDiscount,
    convenienceFee,
    commission,
    customerPays: afterCoverAndDiscount + convenienceFee,
    organizerGets: commissionBase - commission, // ✅ Use commissionBase (not afterDiscount)
    platformEarns: convenienceFee + commission,
    feeRate: event.t2_convenience_fee_value ?? 5
  };

  console.log('💳 Customer Pays (After Cover):', breakdown.customerPays);
  console.log('👤 Organizer Gets:', breakdown.organizerGets);
  console.log('🏦 Platform Earns:', breakdown.platformEarns);
  console.log('===========================================\n');

  return breakdown;
}

/**
 * Complete payment breakdown for restaurants
 */
export function calculateRestaurantBreakdown(
  billAmount: number,
  restaurant: any,
  discountAmount: number = 0,
  coverCharge: number = 0
): {
  billAmount: number;
  discountAmount: number;
  coverCharge: number;
  afterDiscount: number;
  convenienceFee: number;
  commission: number;
  customerPays: number;
  merchantGets: number;
  platformEarns: number;
} {
  console.log('\n🍴 === RESTAURANT BILL BREAKDOWN ===');
  console.log('📋 Bill Amount:', billAmount);
  console.log('🎫 Discount:', discountAmount);
  console.log('💵 Cover Charge:', coverCharge);

  const afterDiscount = billAmount - discountAmount;
  console.log('💵 After Discount:', afterDiscount);

  const convenienceFee = calculateConvenienceFee(
    afterDiscount,
    restaurant.convenience_fee_enabled || false,
    restaurant.convenience_fee_type || 'percentage',
    restaurant.convenience_fee_value ?? 5,
    restaurant.convenience_fee_rules || [],
    restaurant.min_fee_enabled || false,
    restaurant.min_convenience_fee ?? 0,
    restaurant.max_fee_enabled || false,
    restaurant.max_convenience_fee ?? 0
  );

  const commissionRate = restaurant.commission_rate ?? 5;
  const commission = calculateCommission(afterDiscount, commissionRate);

  const breakdown = {
    billAmount,
    discountAmount,
    coverCharge,
    afterDiscount,
    convenienceFee,
    commission,
    customerPays: afterDiscount + convenienceFee - coverCharge,
    merchantGets: afterDiscount - commission,
    platformEarns: convenienceFee + commission
  };

  console.log('💳 Customer Pays:', breakdown.customerPays);
  console.log('👤 Merchant Gets:', breakdown.merchantGets);
  console.log('🏦 Platform Earns:', breakdown.platformEarns);
  console.log('===========================================\n');

  return breakdown;
}

