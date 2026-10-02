/**
 * GATED UI Typography System
 */

export const typography = {
    // Font sizes
    fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        '2xl': 20,
        '3xl': 24,
        '4xl': 32,
        '5xl': 48,
    },

    // Font weights
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    // Line heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Pre-defined text styles
    textStyles: {
        heading1: {
            fontSize: 32,
            fontWeight: '700' as const,
            lineHeight: 40,
        },
        heading2: {
            fontSize: 24,
            fontWeight: '700' as const,
            lineHeight: 32,
        },
        heading3: {
            fontSize: 20,
            fontWeight: '600' as const,
            lineHeight: 28,
        },
        body: {
            fontSize: 16,
            fontWeight: '400' as const,
            lineHeight: 24,
        },
        bodySmall: {
            fontSize: 14,
            fontWeight: '400' as const,
            lineHeight: 20,
        },
        caption: {
            fontSize: 12,
            fontWeight: '400' as const,
            lineHeight: 16,
        },
        label: {
            fontSize: 14,
            fontWeight: '500' as const,
            lineHeight: 20,
        },
        button: {
            fontSize: 16,
            fontWeight: '600' as const,
            lineHeight: 24,
        },
    },
} as const;

export type Typography = typeof typography;
