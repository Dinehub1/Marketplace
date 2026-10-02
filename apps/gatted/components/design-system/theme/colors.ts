/**
 * GATED UI Color Palette
 * Extracted from component hardcoded values for consistent theming
 */

export const colors = {
    // Primary brand colors
    primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
    },

    // Secondary (purple)
    secondary: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
    },

    // Semantic colors
    success: {
        light: '#d1fae5',
        main: '#10b981',
        dark: '#059669',
    },

    warning: {
        light: '#fef3c7',
        main: '#f59e0b',
        dark: '#d97706',
    },

    danger: {
        light: '#fee2e2',
        main: '#ef4444',
        dark: '#dc2626',
    },

    info: {
        light: '#e0e7ff',
        main: '#6366f1',
        dark: '#4f46e5',
    },

    // Neutral gray scale (Slate)
    gray: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
    },

    // Absolute colors
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',

    // Semantic aliases (for common use cases)
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    text: {
        primary: '#1e293b',
        secondary: '#64748b',
        muted: '#94a3b8',
        inverse: '#ffffff',
    },
} as const;

export type Colors = typeof colors;
export type ColorKey = keyof Colors;
