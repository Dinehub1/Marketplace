/**
 * Centralized color theme for the GATTED app.
 * Use these colors throughout the app for consistency.
 */

export const Colors = {
    // Primary brand colors
    primary: '#3b82f6',
    primaryLight: '#dbeafe',
    primaryDark: '#2563eb',

    // Status colors
    success: '#10b981',
    successLight: '#d1fae5',
    successDark: '#059669',

    warning: '#f59e0b',
    warningLight: '#fef3c7',
    warningDark: '#d97706',

    danger: '#ef4444',
    dangerLight: '#fee2e2',
    dangerDark: '#dc2626',

    // Neutral/Gray scale
    text: '#1e293b',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    textLight: '#cbd5e1',

    // Backgrounds
    background: '#f8fafc',
    backgroundWhite: '#fff',
    backgroundMuted: '#f1f5f9',

    // Borders
    border: '#e2e8f0',
    borderLight: '#f1f5f9',

    // Special colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    transparent: 'transparent',
};

// Semantic color aliases for specific use cases
export const SemanticColors = {
    // Button variants
    buttonPrimary: Colors.primary,
    buttonSuccess: Colors.success,
    buttonDanger: Colors.danger,
    buttonWarning: Colors.warning,
    buttonDisabled: Colors.textMuted,

    // Input states
    inputBorder: Colors.border,
    inputBorderFocus: Colors.primary,
    inputBorderError: Colors.danger,
    inputBackground: Colors.backgroundWhite,
    inputPlaceholder: Colors.textMuted,

    // Card styles
    cardBackground: Colors.backgroundWhite,
    cardBorder: Colors.border,
    cardShadow: '#000',

    // Header
    headerBackground: Colors.backgroundWhite,
    headerText: Colors.text,
    headerBorder: Colors.border,
};

export default Colors;
