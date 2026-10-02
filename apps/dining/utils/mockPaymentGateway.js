// Mock Payment Gateway for Restaurant Booking System
// This simulates real payment processing with proper calculations

// Supported payment methods
export const PAYMENT_METHODS = [
  {
    id: 'upi',
    name: 'UPI',
    icon: 'qr-code-outline',
    details: 'Pay with any UPI app',
    processingTime: 2000
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: 'card-outline',
    details: 'Visa, Mastercard, RuPay',
    processingTime: 3000
  },
  {
    id: 'wallet',
    name: 'Paytm Wallet',
    icon: 'wallet-outline',
    details: 'Balance: ₹5,450',
    processingTime: 1500
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    icon: 'card-outline',
    details: 'All major banks supported',
    processingTime: 4000
  }
];

// Generate transaction ID
const generateTransactionId = () => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  return `TXN${timestamp}_${randomSuffix}`;
};

// Generate payment ID
const generatePaymentId = (type = 'payment') => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `pay_${type}_${timestamp}_${randomSuffix}`;
};

// Mock payment processing for advance cover charge (Transaction 1)
export const processAdvancePayment = async (paymentData) => {
  const {
    amount,
    paymentMethod = 'upi',
    userId,
    restaurantId,
    bookingId
  } = paymentData;

  console.log('🏦 Processing advance payment:', {
    amount,
    paymentMethod,
    userId,
    restaurantId,
    bookingId
  });

  // Simulate network delay
  const method = PAYMENT_METHODS.find(m => m.id === paymentMethod) || PAYMENT_METHODS[0];
  await new Promise(resolve => setTimeout(resolve, method.processingTime));

  // Simulate payment success (95% success rate)
  const isSuccess = Math.random() > 0.05;

  if (!isSuccess) {
    return {
      success: false,
      error: {
        code: 'PAYMENT_FAILED',
        message: 'Payment failed due to insufficient funds or technical error'
      }
    };
  }

  // Generate mock gateway response
  const gatewayResponse = {
    transaction_id: generateTransactionId(),
    payment_id: generatePaymentId('advance'),
    amount: parseFloat(amount),
    currency: 'INR',
    status: 'success',
    payment_method: method.name,
    payment_type: paymentMethod,
    gateway_response_code: '00',
    gateway_response_message: 'Transaction successful',
    transaction_time: new Date().toISOString(),
    mock_payment: true
  };

  console.log('✅ Advance payment successful:', gatewayResponse);

  return {
    success: true,
    data: gatewayResponse
  };
};

// Mock payment processing for final bill payment (Transaction 2)
export const processFinalBillPayment = async (paymentData) => {
  const {
    amount,
    paymentMethod = 'upi',
    userId,
    restaurantId,
    bookingId,
    paymentBreakdown
  } = paymentData;

  console.log('🍽️ Processing final bill payment:', {
    amount,
    paymentMethod,
    userId,
    restaurantId,
    bookingId,
    breakdown: paymentBreakdown
  });

  // Simulate network delay
  const method = PAYMENT_METHODS.find(m => m.id === paymentMethod) || PAYMENT_METHODS[0];
  await new Promise(resolve => setTimeout(resolve, method.processingTime));

  // Simulate payment success (98% success rate for final payments)
  const isSuccess = Math.random() > 0.02;

  if (!isSuccess) {
    return {
      success: false,
      error: {
        code: 'PAYMENT_FAILED',
        message: 'Payment failed. Please try again or use a different payment method.'
      }
    };
  }

  // Generate mock gateway response with detailed breakdown
  const gatewayResponse = {
    transaction_id: generateTransactionId(),
    payment_id: generatePaymentId('finalbill'),
    amount: parseFloat(amount),
    currency: 'INR',
    status: 'success',
    payment_method: method.name,
    payment_type: paymentMethod,
    gateway_response_code: '00',
    gateway_response_message: 'Transaction successful',
    transaction_time: new Date().toISOString(),
    payment_breakdown: {
      gross_bill: paymentBreakdown.grossBillAmount,
      discount_amount: paymentBreakdown.discountAmount,
      after_discount: paymentBreakdown.afterDiscount,
      cover_charge_deducted: paymentBreakdown.coverCharge,
      convenience_fee: paymentBreakdown.convenienceFee,
      final_payable: paymentBreakdown.finalPayable,
      // Merchant info (not shown to user)
      commission: paymentBreakdown.commission,
      merchant_due: paymentBreakdown.merchantDue,
      platform_earnings: paymentBreakdown.platformEarnings
    },
    mock_payment: true
  };

  console.log('✅ Final bill payment successful:', gatewayResponse);

  return {
    success: true,
    data: gatewayResponse
  };
};

// Mock refund processing
export const processRefund = async (refundData) => {
  const {
    originalTransactionId,
    refundAmount,
    reason = 'Customer requested cancellation'
  } = refundData;

  console.log('💸 Processing refund:', {
    originalTransactionId,
    refundAmount,
    reason
  });

  // Simulate refund processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate refund success (99% success rate)
  const isSuccess = Math.random() > 0.01;

  if (!isSuccess) {
    return {
      success: false,
      error: {
        code: 'REFUND_FAILED',
        message: 'Refund processing failed. Please contact support.'
      }
    };
  }

  const refundResponse = {
    refund_id: generateTransactionId(),
    original_transaction_id: originalTransactionId,
    refund_amount: parseFloat(refundAmount),
    currency: 'INR',
    status: 'success',
    reason,
    processing_time: '3-5 business days',
    refund_time: new Date().toISOString(),
    mock_refund: true
  };

  console.log('✅ Refund processed successfully:', refundResponse);

  return {
    success: true,
    data: refundResponse
  };
};

// Validate payment amount
export const validatePaymentAmount = (amount, minAmount = 1, maxAmount = 100000) => {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return {
      valid: false,
      error: 'Invalid amount format'
    };
  }
  
  if (numAmount < minAmount) {
    return {
      valid: false,
      error: `Minimum payment amount is ₹${minAmount}`
    };
  }
  
  if (numAmount > maxAmount) {
    return {
      valid: false,
      error: `Maximum payment amount is ₹${maxAmount}`
    };
  }
  
  return {
    valid: true
  };
};

// Format currency for display
export const formatCurrency = (amount, includeCurrency = true) => {
  const numAmount = parseFloat(amount) || 0;
  const formatted = numAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return includeCurrency ? `₹${formatted}` : formatted;
};

// Calculate processing time estimation
export const getProcessingTimeEstimate = (paymentMethod) => {
  const method = PAYMENT_METHODS.find(m => m.id === paymentMethod);
  const time = method ? method.processingTime : 2000;
  
  if (time <= 2000) return 'Instant';
  if (time <= 3000) return '1-2 minutes';
  return '2-3 minutes';
};

// Export gateway status codes for error handling
export const GATEWAY_STATUS_CODES = {
  SUCCESS: '00',
  INSUFFICIENT_FUNDS: '51',
  INVALID_CARD: '14',
  EXPIRED_CARD: '54',
  TRANSACTION_DECLINED: '05',
  NETWORK_ERROR: '96',
  GATEWAY_TIMEOUT: '68'
};

// Mock gateway configuration
export const GATEWAY_CONFIG = {
  environment: 'mock',
  version: '1.0.0',
  supportedCurrencies: ['INR'],
  minimumAmount: 1,
  maximumAmount: 100000,
  supportedMethods: PAYMENT_METHODS.map(m => m.id)
};
