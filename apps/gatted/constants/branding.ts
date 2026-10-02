/**
 * GATTED Branding Configuration
 * Centralized branding constants for the entire application.
 * Update values here to change branding across the app.
 */

export const Branding = {
    // App Identity
    appName: 'GATTED',
    tagline: 'Secure Society Management',

    // Brand Colors
    colors: {
        primary: '#2563eb',
        primaryLight: '#dbeafe',
        primaryDark: '#1d4ed8',
        gradient: ['#2563eb', '#1d4ed8'] as const,
        // Dark identity (matches the neon-G app icon)
        navy: '#0B1120',
        navyLight: '#16213B',
        neon: '#A3E635',
        neonDark: '#84CC16',
        heroGradient: ['#101A33', '#0B1120'] as const,
        textOnDark: '#F1F5F9',
        mutedOnDark: '#8B97AD',
    },

    // Asset paths (require statements for bundling)
    assets: {
        icon: require('@/assets/images/icon.png'),
        splashIcon: require('@/assets/images/splash-icon.png'),
        favicon: require('@/assets/images/favicon.png'),
    },
} as const;

export type BrandingType = typeof Branding;
export default Branding;
