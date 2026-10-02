import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';

interface TypographyProps {
    children: React.ReactNode;
    style?: TextStyle;
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'blockquote' | 'code' | 'lead' | 'large' | 'small' | 'muted';
    numberOfLines?: number;
}

export const Typography: React.FC<TypographyProps> = ({
    children,
    style,
    variant = 'p',
    numberOfLines,
}) => {
    return (
        <Text
            style={[styles[variant], style]}
            numberOfLines={numberOfLines}
        >
            {children}
        </Text>
    );
};

// Individual components for better semantic usage
export const H1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography {...props} variant="h1" />
);

export const H2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography {...props} variant="h2" />
);

export const H3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography {...props} variant="h3" />
);

export const H4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography {...props} variant="h4" />
);

export const P: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography {...props} variant="p" />
);

export const Blockquote: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography {...props} variant="blockquote" />
);

export const Code: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography {...props} variant="code" />
);

export const Lead: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography {...props} variant="lead" />
);

export const Large: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography {...props} variant="large" />
);

export const Small: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography {...props} variant="small" />
);

export const Muted: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography {...props} variant="muted" />
);

const styles = StyleSheet.create({
    h1: {
        fontSize: 36, // text-4xl
        fontWeight: '800', // font-extrabold
        lineHeight: 40, // leading-tight
        letterSpacing: -0.025, // tracking-tight
        color: '#0f172a', // slate-900
    },
    h2: {
        fontSize: 30, // text-3xl
        fontWeight: '700', // font-bold
        lineHeight: 36, // leading-tight
        letterSpacing: -0.025, // tracking-tight
        color: '#0f172a', // slate-900
    },
    h3: {
        fontSize: 24, // text-2xl
        fontWeight: '700', // font-bold
        lineHeight: 32, // leading-tight
        letterSpacing: -0.025, // tracking-tight
        color: '#0f172a', // slate-900
    },
    h4: {
        fontSize: 20, // text-xl
        fontWeight: '600', // font-semibold
        lineHeight: 28, // leading-tight
        letterSpacing: -0.025, // tracking-tight
        color: '#0f172a', // slate-900
    },
    p: {
        fontSize: 16, // text-base
        fontWeight: '400', // font-normal
        lineHeight: 24, // leading-relaxed
        color: '#0f172a', // slate-900
    },
    blockquote: {
        fontSize: 18, // text-lg
        fontWeight: '500', // font-medium
        fontStyle: 'italic',
        lineHeight: 28, // leading-relaxed
        color: '#475569', // slate-600
        borderLeftWidth: 4,
        borderLeftColor: '#e2e8f0', // slate-200
        paddingLeft: 16, // pl-4
        marginVertical: 8, // my-2
    },
    code: {
        fontSize: 14, // text-sm
        fontWeight: '600', // font-semibold
        fontFamily: 'monospace',
        backgroundColor: '#f1f5f9', // slate-100
        color: '#0f172a', // slate-900
        paddingHorizontal: 4, // px-1
        paddingVertical: 2, // py-0.5
        borderRadius: 4,
    },
    lead: {
        fontSize: 20, // text-xl
        fontWeight: '400', // font-normal
        lineHeight: 30, // leading-relaxed
        color: '#475569', // slate-600
    },
    large: {
        fontSize: 18, // text-lg
        fontWeight: '600', // font-semibold
        lineHeight: 28, // leading-7
        color: '#0f172a', // slate-900
    },
    small: {
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
        lineHeight: 20, // leading-5
        color: '#0f172a', // slate-900
    },
    muted: {
        fontSize: 14, // text-sm
        fontWeight: '400', // font-normal
        lineHeight: 20, // leading-5
        color: '#64748b', // slate-500
    },
});

