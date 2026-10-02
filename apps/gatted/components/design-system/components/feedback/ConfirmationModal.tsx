/**
 * ConfirmationModal Component
 * A modal for confirming destructive or important actions
 */
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
    style?: ViewStyle;
}

export function ConfirmationModal({
    visible,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'primary',
    onConfirm,
    onCancel,
    style,
}: ConfirmationModalProps) {
    const theme = useTheme();
    const { colors, borderRadius, spacing, typography, shadows } = theme;

    const confirmButtonColor = confirmVariant === 'danger' ? colors.danger.main : colors.primary[500];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.modal,
                        shadows.lg,
                        {
                            backgroundColor: colors.surface,
                            borderRadius: borderRadius['2xl'],
                            padding: spacing[6],
                            marginHorizontal: spacing[6],
                        },
                        style,
                    ]}
                >
                    <Text
                        style={[
                            styles.title,
                            {
                                color: colors.text.primary,
                                marginBottom: spacing[2],
                                fontSize: typography.fontSize['2xl'],
                            },
                        ]}
                    >
                        {title}
                    </Text>
                    <Text
                        style={[
                            styles.message,
                            {
                                color: colors.text.secondary,
                                marginBottom: spacing[6],
                                fontSize: typography.fontSize.lg,
                            },
                        ]}
                    >
                        {message}
                    </Text>
                    <View style={[styles.actions, { gap: spacing[3] }]}>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                {
                                    backgroundColor: colors.gray[100],
                                    borderRadius: borderRadius.lg,
                                    paddingVertical: spacing[4],
                                },
                            ]}
                            onPress={onCancel}
                        >
                            <Text style={[styles.cancelText, { color: colors.text.secondary }]}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                {
                                    backgroundColor: confirmButtonColor,
                                    borderRadius: borderRadius.lg,
                                    paddingVertical: spacing[4],
                                },
                            ]}
                            onPress={onConfirm}
                        >
                            <Text style={[styles.confirmText, { color: colors.white }]}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '100%',
        maxWidth: 400,
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    message: {
        textAlign: 'center',
        lineHeight: 24,
    },
    actions: {
        flexDirection: 'row',
    },
    button: {
        flex: 1,
        alignItems: 'center',
    },
    cancelText: {
        fontWeight: '600',
        fontSize: 16,
    },
    confirmText: {
        fontWeight: '600',
        fontSize: 16,
    },
});
