import { Alert } from 'react-native';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  screen?: string;
  action?: string;
}

export enum ErrorCodes {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // Authentication errors
  AUTH_FAILED = 'AUTH_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PHONE = 'INVALID_PHONE',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  
  // Appointment errors
  APPOINTMENT_CONFLICT = 'APPOINTMENT_CONFLICT',
  DOCTOR_UNAVAILABLE = 'DOCTOR_UNAVAILABLE',
  INVALID_DATE = 'INVALID_DATE',
  BOOKING_FAILED = 'BOOKING_FAILED',
  
  // Payment errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CARD_DECLINED = 'CARD_DECLINED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PAYMENT_TIMEOUT = 'PAYMENT_TIMEOUT',
  
  // Database errors
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
}

class ErrorService {
  private errorLog: AppError[] = [];

  logError(error: AppError) {
    this.errorLog.push(error);
    console.error('App Error:', error);
    
    // In production, you might want to send this to a logging service
    // this.sendToLoggingService(error);
  }

  createError(
    code: ErrorCodes,
    message: string,
    details?: any,
    userId?: string,
    screen?: string,
    action?: string
  ): AppError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
      userId,
      screen,
      action,
    };
  }

  handleError(error: any, context?: { screen?: string; action?: string; userId?: string }): AppError {
    let appError: AppError;

    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          appError = this.createError(
            ErrorCodes.VALIDATION_ERROR,
            data.message || 'Invalid request',
            data,
            context?.userId,
            context?.screen,
            context?.action
          );
          break;
        case 401:
          appError = this.createError(
            ErrorCodes.UNAUTHORIZED,
            'Authentication required',
            data,
            context?.userId,
            context?.screen,
            context?.action
          );
          break;
        case 403:
          appError = this.createError(
            ErrorCodes.PERMISSION_DENIED,
            'Access denied',
            data,
            context?.userId,
            context?.screen,
            context?.action
          );
          break;
        case 404:
          appError = this.createError(
            ErrorCodes.RECORD_NOT_FOUND,
            'Resource not found',
            data,
            context?.userId,
            context?.screen,
            context?.action
          );
          break;
        case 409:
          appError = this.createError(
            ErrorCodes.APPOINTMENT_CONFLICT,
            data.message || 'Conflict occurred',
            data,
            context?.userId,
            context?.screen,
            context?.action
          );
          break;
        case 500:
          appError = this.createError(
            ErrorCodes.SERVER_ERROR,
            'Server error occurred',
            data,
            context?.userId,
            context?.screen,
            context?.action
          );
          break;
        default:
          appError = this.createError(
            ErrorCodes.UNKNOWN_ERROR,
            data.message || 'An unexpected error occurred',
            data,
            context?.userId,
            context?.screen,
            context?.action
          );
      }
    } else if (error.request) {
      // Network error
      appError = this.createError(
        ErrorCodes.NETWORK_ERROR,
        'Network connection failed',
        error.request,
        context?.userId,
        context?.screen,
        context?.action
      );
    } else if (error.code === 'TIMEOUT') {
      appError = this.createError(
        ErrorCodes.TIMEOUT_ERROR,
        'Request timed out',
        error,
        context?.userId,
        context?.screen,
        context?.action
      );
    } else {
      // Other errors
      appError = this.createError(
        ErrorCodes.UNKNOWN_ERROR,
        error.message || 'An unexpected error occurred',
        error,
        context?.userId,
        context?.screen,
        context?.action
      );
    }

    this.logError(appError);
    return appError;
  }

  showErrorAlert(error: AppError, customTitle?: string) {
    const title = customTitle || this.getErrorTitle(error.code);
    const message = this.getUserFriendlyMessage(error);

    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          style: 'default',
        },
        ...(this.shouldShowRetry(error.code) ? [
          {
            text: 'Retry',
            style: 'default',
            onPress: () => {
              // Emit retry event or callback
              console.log('Retry requested for error:', error.code);
            },
          }
        ] : []),
      ],
      { cancelable: true }
    );
  }

  private getErrorTitle(code: string): string {
    switch (code) {
      case ErrorCodes.NETWORK_ERROR:
      case ErrorCodes.TIMEOUT_ERROR:
        return 'Connection Error';
      case ErrorCodes.AUTH_FAILED:
      case ErrorCodes.TOKEN_EXPIRED:
      case ErrorCodes.UNAUTHORIZED:
        return 'Authentication Error';
      case ErrorCodes.VALIDATION_ERROR:
      case ErrorCodes.REQUIRED_FIELD:
      case ErrorCodes.INVALID_EMAIL:
      case ErrorCodes.INVALID_PHONE:
        return 'Validation Error';
      case ErrorCodes.APPOINTMENT_CONFLICT:
      case ErrorCodes.DOCTOR_UNAVAILABLE:
        return 'Booking Error';
      case ErrorCodes.PAYMENT_FAILED:
      case ErrorCodes.CARD_DECLINED:
        return 'Payment Error';
      default:
        return 'Error';
    }
  }

  private getUserFriendlyMessage(error: AppError): string {
    switch (error.code) {
      case ErrorCodes.NETWORK_ERROR:
        return 'Please check your internet connection and try again.';
      case ErrorCodes.TIMEOUT_ERROR:
        return 'The request took too long. Please try again.';
      case ErrorCodes.AUTH_FAILED:
        return 'Invalid email or password. Please check your credentials.';
      case ErrorCodes.TOKEN_EXPIRED:
        return 'Your session has expired. Please log in again.';
      case ErrorCodes.UNAUTHORIZED:
        return 'You need to log in to access this feature.';
      case ErrorCodes.VALIDATION_ERROR:
        return error.message || 'Please check your input and try again.';
      case ErrorCodes.APPOINTMENT_CONFLICT:
        return 'This time slot is no longer available. Please choose another time.';
      case ErrorCodes.DOCTOR_UNAVAILABLE:
        return 'The selected doctor is not available at this time.';
      case ErrorCodes.PAYMENT_FAILED:
        return 'Payment could not be processed. Please try again or use a different payment method.';
      case ErrorCodes.CARD_DECLINED:
        return 'Your card was declined. Please check your card details or try a different card.';
      case ErrorCodes.RECORD_NOT_FOUND:
        return 'The requested information could not be found.';
      case ErrorCodes.SERVER_ERROR:
        return 'A server error occurred. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  private shouldShowRetry(code: string): boolean {
    const retryableCodes = [
      ErrorCodes.NETWORK_ERROR,
      ErrorCodes.TIMEOUT_ERROR,
      ErrorCodes.SERVER_ERROR,
    ];
    return retryableCodes.includes(code as ErrorCodes);
  }

  // Validation helpers
  validateEmail(email: string): AppError | null {
    if (!email) {
      return this.createError(ErrorCodes.REQUIRED_FIELD, 'Email is required');
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return this.createError(ErrorCodes.INVALID_EMAIL, 'Please enter a valid email address');
    }
    return null;
  }

  validatePassword(password: string): AppError | null {
    if (!password) {
      return this.createError(ErrorCodes.REQUIRED_FIELD, 'Password is required');
    }
    if (password.length < 6) {
      return this.createError(ErrorCodes.PASSWORD_TOO_WEAK, 'Password must be at least 6 characters long');
    }
    return null;
  }

  validatePhone(phone: string): AppError | null {
    if (!phone) {
      return this.createError(ErrorCodes.REQUIRED_FIELD, 'Phone number is required');
    }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      return this.createError(ErrorCodes.INVALID_PHONE, 'Please enter a valid 10-digit phone number');
    }
    return null;
  }

  validateRequiredField(value: string, fieldName: string): AppError | null {
    if (!value || value.trim().length === 0) {
      return this.createError(ErrorCodes.REQUIRED_FIELD, `${fieldName} is required`);
    }
    return null;
  }

  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  clearErrorLog() {
    this.errorLog = [];
  }
}

export const errorService = new ErrorService();
