/**
 * TextInput Component
 * A styled text input with label and error support
 */
import React from 'react';
import {
    TextInput as RNTextInput,
    TextInputProps as RNTextInputProps,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

export interface TextInputProps extends RNTextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    required?: boolean;
}

export function TextInput({
    label,
    error,
    containerStyle,
    required,
    style,
    ...props
}: TextInputProps) {
    const theme = useTheme();
    const { colors, borderRadius, spacing, typography } = theme;

    return (
        <View style={[styles.container, { marginBottom: spacing[4] }, containerStyle]}>
            {label && (
                <Text
                    style={[
                        styles.label,
                        {
                            color: colors.gray[700],
                            marginBottom: spacing[2],
                            fontSize: typography.fontSize.md,
                        },
                    ]}
                >
                    {label}
                    {required && <Text style={{ color: colors.danger.main }}> *</Text>}
                </Text>
            )}
            <RNTextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.surface,
                        borderColor: error ? colors.danger.main : colors.border,
                        borderRadius: borderRadius.lg,
                        paddingHorizontal: spacing[4],
                        paddingVertical: spacing[3] + 2,
                        fontSize: typography.fontSize.lg,
                        color: colors.text.primary,
                    },
                    style,
                ]}
                placeholderTextColor={colors.gray[400]}
                {...props}
            />
            {error && (
                <Text
                    style={[
                        styles.errorText,
                        {
                            color: colors.danger.main,
                            marginTop: spacing[1],
                            fontSize: typography.fontSize.sm,
                        },
                    ]}
                >
                    {error}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {},
    label: {
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
    },
    errorText: {},
});
