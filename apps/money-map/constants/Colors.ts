/**
 * Money Map's palette. The brand green (#059669) is the colour the fleet listing declares
 * in apps/mobile/targets.mjs; spending is a warm red and income the brand green, in both
 * schemes, so "which way did the money go" reads the same in the dark.
 */
export const Colors = {
  light: {
    text: '#0f172a',
    muted: '#64748b',
    background: '#f6f8f7',
    card: '#ffffff',
    border: '#e5e9e7',
    track: '#edf1ef',
    tint: '#059669',
    onTint: '#ffffff',
    hero: '#047857',
    onHero: '#ffffff',
    onHeroMuted: '#a7f3d0',
    income: '#059669',
    expense: '#dc2626',
    warning: '#d97706',
    tabIconDefault: '#94a3b8',
  },
  dark: {
    text: '#e7ecea',
    muted: '#94a3a0',
    background: '#0b1110',
    card: '#141c1a',
    border: '#22302c',
    track: '#1e2926',
    tint: '#34d399',
    onTint: '#04211a',
    hero: '#065f46',
    onHero: '#ecfdf5',
    onHeroMuted: '#86efac',
    income: '#34d399',
    expense: '#f87171',
    warning: '#fbbf24',
    tabIconDefault: '#5b6b67',
  },
};

export type Palette = typeof Colors.light;
