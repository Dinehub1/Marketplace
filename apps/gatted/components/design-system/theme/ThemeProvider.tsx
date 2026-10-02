/**
 * GATED UI Theme Provider
 * Provides theme context for customization
 */
import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { colors, Colors } from './colors';
import { borderRadius, BorderRadius, shadows, Shadows, spacing, Spacing } from './spacing';
import { typography, Typography } from './typography';

export interface Theme {
    colors: Colors;
    typography: Typography;
    spacing: Spacing;
    borderRadius: BorderRadius;
    shadows: Shadows;
}

export const defaultTheme: Theme = {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
};

const ThemeContext = createContext<Theme>(defaultTheme);

export interface ThemeProviderProps {
    theme?: Partial<Theme>;
    children: ReactNode;
}

export function ThemeProvider({ theme: customTheme, children }: ThemeProviderProps) {
    const theme = useMemo(() => {
        if (!customTheme) return defaultTheme;

        return {
            colors: { ...defaultTheme.colors, ...customTheme.colors },
            typography: { ...defaultTheme.typography, ...customTheme.typography },
            spacing: { ...defaultTheme.spacing, ...customTheme.spacing },
            borderRadius: { ...defaultTheme.borderRadius, ...customTheme.borderRadius },
            shadows: { ...defaultTheme.shadows, ...customTheme.shadows },
        };
    }, [customTheme]);

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): Theme {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
