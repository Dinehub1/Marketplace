import { apiService, ApiResponse } from './apiService';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'stripe' | 'razorpay' | 'apple_pay' | 'google_pay';
  name: string;
  icon: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  appointmentId: string;
  paymentMethodId: string;
  description?: string;
}

export interface PaymentResult {
  id: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  amount: number;
  currency: string;
  paymentMethodId: string;
  appointmentId: string;
  transactionId?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface StripePaymentIntent {
  id: string;
  clientSecret: string;
  status: string;
}

class PaymentService {
  // Get available payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      // For development, return mock payment methods
      if (process.env.NODE_ENV === 'development') {
        return this.getMockPaymentMethods();
      }

      const response = await apiService.get<ApiResponse<PaymentMethod[]>>('/payment/methods');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return this.getMockPaymentMethods();
    }
  }

  // Create payment intent for Stripe
  async createPaymentIntent(request: PaymentRequest): Promise<StripePaymentIntent> {
    try {
      console.info('💳 Creating payment intent:', request);

      // For development, return mock payment intent
      if (process.env.NODE_ENV === 'development') {
        return this.createMockPaymentIntent(request);
      }

      const response = await apiService.post<ApiResponse<StripePaymentIntent>>(
        '/payment/create-intent',
        request
      );

      if (!response.data) {
        throw new Error('Failed to create payment intent');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      // Return mock for demo
      return this.createMockPaymentIntent(request);
    }
  }

  // Process payment
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      console.info('💳 Processing payment:', request);

      // For development, simulate payment processing
      if (process.env.NODE_ENV === 'development') {
        return this.processMockPayment(request);
      }

      const response = await apiService.post<ApiResponse<PaymentResult>>(
        '/payment/process',
        request
      );

      if (!response.data) {
        throw new Error('Payment processing failed');
      }

      console.info('✅ Payment processed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      throw error;
    }
  }

  // Confirm payment (for Stripe)
  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentResult> {
    try {
      console.info('💳 Confirming payment:', { paymentIntentId, paymentMethodId });

      const response = await apiService.post<ApiResponse<PaymentResult>>(
        '/payment/confirm',
        { paymentIntentId, paymentMethodId }
      );

      if (!response.data) {
        throw new Error('Payment confirmation failed');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      throw error;
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<PaymentResult> {
    try {
      const response = await apiService.get<ApiResponse<PaymentResult>>(
        `/payment/${paymentId}/status`
      );

      if (!response.data) {
        throw new Error('Payment not found');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching payment status:', error);
      throw error;
    }
  }

  // Refund payment
  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResult> {
    try {
      console.info('💰 Refunding payment:', { paymentId, amount });

      const response = await apiService.post<ApiResponse<PaymentResult>>(
        `/payment/${paymentId}/refund`,
        { amount }
      );

      if (!response.data) {
        throw new Error('Refund failed');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error refunding payment:', error);
      throw error;
    }
  }

  // Mock data methods for development
  private getMockPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'card_1',
        type: 'card',
        name: 'Credit Card',
        icon: 'card-outline',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2027,
        isDefault: true,
      },
      {
        id: 'paypal_1',
        type: 'paypal',
        name: 'PayPal',
        icon: 'logo-paypal',
        isDefault: false,
      },
      {
        id: 'apple_pay_1',
        type: 'apple_pay',
        name: 'Apple Pay',
        icon: 'logo-apple',
        isDefault: false,
      },
      {
        id: 'google_pay_1',
        type: 'google_pay',
        name: 'Google Pay',
        icon: 'logo-google',
        isDefault: false,
      },
    ];
  }

  private createMockPaymentIntent(request: PaymentRequest): StripePaymentIntent {
    return {
      id: `pi_${Date.now()}`,
      clientSecret: `pi_${Date.now()}_secret_mock`,
      status: 'requires_payment_method',
    };
  }

  private async processMockPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate occasional payment failures for testing
    const shouldFail = Math.random() < 0.1; // 10% chance of failure

    if (shouldFail) {
      return {
        id: `pay_${Date.now()}_failed`,
        status: 'failed',
        amount: request.amount,
        currency: request.currency,
        paymentMethodId: request.paymentMethodId,
        appointmentId: request.appointmentId,
        errorMessage: 'Payment was declined by your bank. Please try a different payment method.',
        createdAt: new Date().toISOString(),
      };
    }

    return {
      id: `pay_${Date.now()}`,
      status: 'succeeded',
      amount: request.amount,
      currency: request.currency,
      paymentMethodId: request.paymentMethodId,
      appointmentId: request.appointmentId,
      transactionId: `txn_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
  }
}

export const paymentService = new PaymentService();
