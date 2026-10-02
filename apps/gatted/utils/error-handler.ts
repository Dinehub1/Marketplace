/**
 * Centralized error handling utility
 */

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorLogOptions {
    severity?: ErrorSeverity;
    context?: Record<string, any>;
    userId?: string;
}

/**
 * Log error to console in development and to monitoring service in production
 */
export function logError(error: Error | unknown, message?: string, options?: ErrorLogOptions) {
    const errorMessage = message || 'An error occurred';
    const severity = options?.severity || 'medium';

    if (__DEV__) {
        // Development: Log to console with full details
        console.error(`[${severity.toUpperCase()}] ${errorMessage}`, {
            error,
            context: options?.context,
            timestamp: new Date().toISOString(),
        });
    } else {
        // Production: Send to error monitoring service
        // TODO: Integrate with Sentry or similar service
        // Example: Sentry.captureException(error, { level: severity, extra: options?.context });
        console.error(errorMessage);
    }
}

/**
 * Handle API errors and return user-friendly messages
 */
export function handleApiError(error: any): string {
    // Supabase error handling
    if (error?.message) {
        if (error.message.includes('Network request failed')) {
            return 'Backend is unreachable. Check your Supabase URL or internet connection.';
        }
        if (error.message.includes('Unexpected character: <') || error.message.includes('JSON Parse error')) {
            return 'Backend returned HTML instead of API JSON. Check EXPO_PUBLIC_SUPABASE_URL.';
        }
        // Common Supabase errors
        if (error.message.includes('JWT')) {
            return 'Your session has expired. Please log in again.';
        }
        if (error.message.includes('permission denied')) {
            return 'You do not have permission to perform this action.';
        }
        if (error.message.includes('violates foreign key constraint')) {
            return 'Invalid reference. Please check your data.';
        }
        if (error.message.includes('duplicate key')) {
            return 'This record already exists.';
        }
    }

    // Network errors
    if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
        return 'Connection timeout. Please check your internet connection.';
    }

    // Default fallback
    return 'An unexpected error occurred. Please try again.';
}

/**
 * Handle form validation errors
 */
export function getValidationError(field: string, value: any): string | null {
    // Phone validation
    if (field === 'phone') {
        if (!value) return 'Phone number is required';
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
    }

    // Email validation
    if (field === 'email') {
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
    }

    // Required field
    if (!value && value !== 0) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }

    return null;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json);
    } catch (error) {
        logError(error, 'JSON parse error', { severity: 'low', context: { json } });
        return fallback;
    }
}

/**
 * Retry async operation with exponential backoff
 */
export async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            if (attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, attempt);
                logError(error, `Retry attempt ${attempt + 1}/${maxRetries}`, {
                    severity: 'low',
                    context: { delay },
                });
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError!;
}
