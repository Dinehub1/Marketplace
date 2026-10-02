import { Platform } from 'react-native';

// Conditionally import Meta SDK - only works in native builds, not Expo Go
let AppEventsLogger: any = null;
try {
  const fbsdk = require('react-native-fbsdk-next');
  AppEventsLogger = fbsdk.AppEventsLogger;
} catch (error) {
  console.warn('⚠️ Meta SDK not available (Expo Go). Build a development build to enable Meta tracking.');
}

// Standard Event Names from Meta
export const MetaEvents = {
  // User Actions
  COMPLETE_REGISTRATION: 'fb_mobile_complete_registration',
  CONTACT: 'Contact',
  SEARCH: 'fb_mobile_search',
  VIEW_CONTENT: 'fb_mobile_content_view',
  FIND_LOCATION: 'fb_mobile_find_location',
  RATE: 'fb_mobile_rate',
  SCHEDULE: 'fb_mobile_schedule',
  
  // E-commerce Events
  ADD_TO_CART: 'fb_mobile_add_to_cart',
  ADD_TO_WISHLIST: 'fb_mobile_add_to_wishlist',
  INITIATE_CHECKOUT: 'fb_mobile_initiated_checkout',
  ADD_PAYMENT_INFO: 'fb_mobile_add_payment_info',
  PURCHASE: 'fb_mobile_purchase',
  
  // Engagement Events
  ACHIEVE_LEVEL: 'fb_mobile_level_achieved',
  START_TRIAL: 'StartTrial',
  SUBSCRIBE: 'Subscribe',
  
  // Ad Events
  AD_CLICK: 'AdClick',
  AD_IMPRESSION: 'AdImpression',
};

// Standard Parameters from Meta
export const MetaParams = {
  CONTENT_ID: 'fb_content_id',
  CONTENT_TYPE: 'fb_content_type',
  CURRENCY: 'fb_currency',
  VALUE_TO_SUM: '_valueToSum',
  REGISTRATION_METHOD: 'fb_registration_method',
  SUCCESS: 'fb_success',
  MAX_RATING_VALUE: 'fb_max_rating_value',
  SEARCH_STRING: 'fb_search_string',
  NUM_ITEMS: 'fb_num_items',
  PAYMENT_INFO_AVAILABLE: 'fb_payment_info_available',
  LEVEL: 'fb_level',
  DESCRIPTION: 'fb_description',
};

class MetaAnalyticsService {
  private isInitialized = false;
  private isEnabled = true;

  // Initialize the service
  async initialize() {
    try {
      // Check if SDK is available (not in Expo Go)
      if (!AppEventsLogger) {
        console.warn('⚠️ Meta SDK not available. Running in Expo Go or SDK not installed.');
        console.warn('📱 To enable Meta tracking, build a development build: npx expo run:android or npx expo run:ios');
        this.isEnabled = false;
        return;
      }

      // SDK auto-initializes with config from app.json
      this.isInitialized = true;
      console.log('✅ Meta Analytics initialized for DropBy');
      console.log(`📱 Platform: ${Platform.OS}`);
      
      // Log app install/launch (automatic with SDK)
      this.logCustomEvent('app_initialized', {
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Meta Analytics initialization failed:', error);
      this.isEnabled = false;
    }
  }

  // Check if analytics is ready
  private checkInitialized(): boolean {
    if (!AppEventsLogger) {
      // Silently fail in Expo Go - don't spam console
      return false;
    }
    if (!this.isInitialized || !this.isEnabled) {
      console.warn('⚠️ Meta Analytics not initialized or disabled');
      return false;
    }
    return true;
  }

  // Generic event logger
  logEvent(eventName: string, parameters?: Record<string, any>, valueToSum?: number) {
    if (!this.checkInitialized()) return;

    try {
      if (valueToSum !== undefined) {
        AppEventsLogger.logEvent(eventName, valueToSum, parameters);
        console.log(`📊 Meta Event: ${eventName} | Value: ${valueToSum}`, parameters);
      } else {
        AppEventsLogger.logEvent(eventName, parameters);
        console.log(`📊 Meta Event: ${eventName}`, parameters);
      }
    } catch (error) {
      console.error(`❌ Failed to log event ${eventName}:`, error);
    }
  }

  // User Registration
  logCompleteRegistration(method: string = 'phone') {
    this.logEvent(MetaEvents.COMPLETE_REGISTRATION, {
      [MetaParams.REGISTRATION_METHOD]: method,
      timestamp: new Date().toISOString(),
    });
  }

  // Search Events
  logSearch(searchQuery: string, contentType: 'restaurant' | 'event' | 'activity') {
    this.logEvent(MetaEvents.SEARCH, {
      [MetaParams.SEARCH_STRING]: searchQuery,
      [MetaParams.CONTENT_TYPE]: contentType,
      timestamp: new Date().toISOString(),
    });
  }

  // View Content (Restaurant/Event Details)
  logViewContent(contentId: string, contentType: 'restaurant' | 'event', contentName?: string) {
    this.logEvent(MetaEvents.VIEW_CONTENT, {
      [MetaParams.CONTENT_ID]: contentId,
      [MetaParams.CONTENT_TYPE]: contentType,
      [MetaParams.DESCRIPTION]: contentName || '',
      timestamp: new Date().toISOString(),
    });
  }

  // Add to Cart (Start Booking)
  logAddToCart(contentId: string, contentType: 'restaurant' | 'event', value: number) {
    this.logEvent(
      MetaEvents.ADD_TO_CART,
      {
        [MetaParams.CONTENT_ID]: contentId,
        [MetaParams.CONTENT_TYPE]: contentType,
        [MetaParams.CURRENCY]: 'INR',
        timestamp: new Date().toISOString(),
      },
      value
    );
  }

  // Add to Wishlist (Favorite)
  logAddToWishlist(contentId: string, contentType: 'restaurant' | 'event', contentName?: string) {
    this.logEvent(MetaEvents.ADD_TO_WISHLIST, {
      [MetaParams.CONTENT_ID]: contentId,
      [MetaParams.CONTENT_TYPE]: contentType,
      [MetaParams.DESCRIPTION]: contentName || '',
      timestamp: new Date().toISOString(),
    });
  }

  // Initiate Checkout (Booking Summary)
  logInitiateCheckout(
    contentId: string, 
    contentType: 'restaurant' | 'event', 
    value: number, 
    numItems: number = 1
  ) {
    this.logEvent(
      MetaEvents.INITIATE_CHECKOUT,
      {
        [MetaParams.CONTENT_ID]: contentId,
        [MetaParams.CONTENT_TYPE]: contentType,
        [MetaParams.CURRENCY]: 'INR',
        [MetaParams.NUM_ITEMS]: numItems,
        timestamp: new Date().toISOString(),
      },
      value
    );
  }

  // Add Payment Info
  logAddPaymentInfo(success: boolean, paymentMethod?: string) {
    this.logEvent(MetaEvents.ADD_PAYMENT_INFO, {
      [MetaParams.SUCCESS]: success ? '1' : '0',
      payment_method: paymentMethod || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  // Purchase (Completed Booking/Payment) - MOST IMPORTANT EVENT
  logPurchase(
    contentId: string,
    contentType: 'restaurant_booking' | 'event_booking' | 'event_ticket' | 'bill_payment',
    value: number,
    currency: string = 'INR',
    additionalParams?: Record<string, any>
  ) {
    this.logEvent(
      MetaEvents.PURCHASE,
      {
        [MetaParams.CONTENT_ID]: contentId,
        [MetaParams.CONTENT_TYPE]: contentType,
        [MetaParams.CURRENCY]: currency,
        timestamp: new Date().toISOString(),
        ...additionalParams,
      },
      value
    );
  }

  // Contact (Call/Email Restaurant)
  logContact(method: 'phone' | 'email', restaurantId: string, restaurantName?: string) {
    this.logEvent(MetaEvents.CONTACT, {
      [MetaParams.CONTENT_ID]: restaurantId,
      [MetaParams.CONTENT_TYPE]: 'restaurant',
      contact_method: method,
      [MetaParams.DESCRIPTION]: restaurantName || '',
      timestamp: new Date().toISOString(),
    });
  }

  // Find Location (View Map)
  logFindLocation(contentId: string, contentType: 'restaurant' | 'event', contentName?: string) {
    this.logEvent(MetaEvents.FIND_LOCATION, {
      [MetaParams.CONTENT_ID]: contentId,
      [MetaParams.CONTENT_TYPE]: contentType,
      [MetaParams.DESCRIPTION]: contentName || '',
      timestamp: new Date().toISOString(),
    });
  }

  // Rate (Submit Review)
  logRate(contentId: string, rating: number, maxRating: number = 5, contentName?: string) {
    this.logEvent(
      MetaEvents.RATE,
      {
        [MetaParams.CONTENT_ID]: contentId,
        [MetaParams.CONTENT_TYPE]: 'restaurant',
        [MetaParams.MAX_RATING_VALUE]: maxRating,
        [MetaParams.DESCRIPTION]: contentName || '',
        timestamp: new Date().toISOString(),
      },
      rating
    );
  }

  // Schedule (Book Table/Event)
  logSchedule(contentId: string, contentType: 'restaurant' | 'event', contentName?: string) {
    this.logEvent(MetaEvents.SCHEDULE, {
      [MetaParams.CONTENT_ID]: contentId,
      [MetaParams.CONTENT_TYPE]: contentType,
      [MetaParams.DESCRIPTION]: contentName || '',
      timestamp: new Date().toISOString(),
    });
  }

  // Ad Click
  logAdClick(adId: string, adType?: string) {
    this.logEvent(MetaEvents.AD_CLICK, {
      ad_id: adId,
      ad_type: adType || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  // Ad Impression
  logAdImpression(adId: string, adType?: string) {
    this.logEvent(MetaEvents.AD_IMPRESSION, {
      ad_id: adId,
      ad_type: adType || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  // Custom Events
  logCustomEvent(eventName: string, parameters?: Record<string, any>) {
    this.logEvent(eventName, parameters);
  }

  // Booking specific events
  logBookingStarted(bookingType: 'restaurant' | 'event', contentId: string, contentName?: string) {
    this.logCustomEvent('booking_started', {
      booking_type: bookingType,
      [MetaParams.CONTENT_ID]: contentId,
      [MetaParams.DESCRIPTION]: contentName || '',
      timestamp: new Date().toISOString(),
    });
  }

  logBookingCompleted(
    bookingId: string, 
    bookingType: 'restaurant' | 'event', 
    value: number,
    contentId: string
  ) {
    this.logCustomEvent('booking_completed', {
      booking_id: bookingId,
      booking_type: bookingType,
      [MetaParams.CONTENT_ID]: contentId,
      [MetaParams.CURRENCY]: 'INR',
      value: value,
      timestamp: new Date().toISOString(),
    });
  }

  // Payment tracking
  logPaymentInitiated(amount: number, paymentMethod: string, bookingId: string) {
    this.logCustomEvent('payment_initiated', {
      amount: amount,
      payment_method: paymentMethod,
      booking_id: bookingId,
      [MetaParams.CURRENCY]: 'INR',
      timestamp: new Date().toISOString(),
    });
  }

  logPaymentSuccess(amount: number, paymentMethod: string, bookingId: string, transactionId: string) {
    this.logCustomEvent('payment_success', {
      amount: amount,
      payment_method: paymentMethod,
      booking_id: bookingId,
      transaction_id: transactionId,
      [MetaParams.CURRENCY]: 'INR',
      timestamp: new Date().toISOString(),
    });
  }

  logPaymentFailed(amount: number, paymentMethod: string, bookingId: string, error: string) {
    this.logCustomEvent('payment_failed', {
      amount: amount,
      payment_method: paymentMethod,
      booking_id: bookingId,
      error: error,
      [MetaParams.CURRENCY]: 'INR',
      timestamp: new Date().toISOString(),
    });
  }

  // Enable/Disable tracking
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    console.log(`📊 Meta Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
export const metaAnalytics = new MetaAnalyticsService();
