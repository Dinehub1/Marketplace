/**
 * Date utility functions for consistent date/time formatting across the app.
 */

// Locale for Indian date/time formatting
const LOCALE = 'en-IN';

/**
 * Format date to display string (e.g., "11 Jan 2026")
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(LOCALE, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format time to display string (e.g., "04:30 PM")
 */
export function formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString(LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format date and time together (e.g., "11 Jan 2026 at 04:30 PM")
 */
export function formatDateTime(date: Date | string): string {
    return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Get date in ISO format for database (YYYY-MM-DD)
 */
export function toISODate(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Get time in HH:MM format for database
 */
export function toTimeString(date: Date): string {
    return date.toTimeString().slice(0, 5);
}

/**
 * Get today's date in ISO format
 */
export function getTodayISO(): string {
    return toISODate(new Date());
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return toISODate(d) === getTodayISO();
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d < new Date();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d > new Date();
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (Math.abs(diffSecs) < 60) {
        return 'just now';
    } else if (Math.abs(diffMins) < 60) {
        return diffMins > 0 ? `in ${diffMins} min` : `${Math.abs(diffMins)} min ago`;
    } else if (Math.abs(diffHours) < 24) {
        return diffHours > 0 ? `in ${diffHours} hr` : `${Math.abs(diffHours)} hr ago`;
    } else if (Math.abs(diffDays) < 7) {
        return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
    } else {
        return formatDate(d);
    }
}

/**
 * Add hours to a date
 */
export function addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
