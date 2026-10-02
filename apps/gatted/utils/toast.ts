/**
 * Toast/Alert utility for consistent user feedback across the app.
 * Uses React Native Alert as a fallback since we don't have a toast library.
 */

import { Alert } from 'react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
    title?: string;
    message: string;
    type?: ToastType;
    onPress?: () => void;
    buttons?: Array<{
        text: string;
        onPress?: () => void;
        style?: 'default' | 'cancel' | 'destructive';
    }>;
}

const ICONS: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
};

/**
 * Show a simple toast/alert message
 */
export function showToast(options: ToastOptions | string): void {
    if (typeof options === 'string') {
        Alert.alert('', options);
        return;
    }

    const { title, message, type = 'info', onPress, buttons } = options;
    const icon = ICONS[type];
    const displayTitle = title ? `${icon} ${title}` : icon;

    if (buttons) {
        Alert.alert(displayTitle, message, buttons);
    } else if (onPress) {
        Alert.alert(displayTitle, message, [{ text: 'OK', onPress }]);
    } else {
        Alert.alert(displayTitle, message);
    }
}

/**
 * Show success message
 */
export function showSuccess(message: string, title?: string, onPress?: () => void): void {
    showToast({ title: title || 'Success', message, type: 'success', onPress });
}

/**
 * Show error message
 */
export function showError(message: string, title?: string): void {
    showToast({ title: title || 'Error', message, type: 'error' });
}

/**
 * Show warning message
 */
export function showWarning(message: string, title?: string): void {
    showToast({ title: title || 'Warning', message, type: 'warning' });
}

/**
 * Show info message
 */
export function showInfo(message: string, title?: string): void {
    showToast({ title: title || 'Info', message, type: 'info' });
}

/**
 * Show confirmation dialog
 */
export function showConfirm(
    message: string,
    onConfirm: () => void,
    options?: {
        title?: string;
        confirmText?: string;
        cancelText?: string;
        destructive?: boolean;
    }
): void {
    const { title = 'Confirm', confirmText = 'Confirm', cancelText = 'Cancel', destructive = false } = options || {};

    Alert.alert(title, message, [
        { text: cancelText, style: 'cancel' },
        { text: confirmText, onPress: onConfirm, style: destructive ? 'destructive' : 'default' },
    ]);
}

/**
 * Handle and display API errors consistently
 */
export function handleApiError(error: any, fallbackMessage: string = 'An error occurred'): void {
    console.error('API Error:', error);
    const message = error?.message || error?.error?.message || fallbackMessage;
    showError(message);
}

export default {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    handleApiError,
};
