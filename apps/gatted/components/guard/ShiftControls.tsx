import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ShiftControlsProps {
    isShiftActive: boolean;
    shiftStartTime?: Date;
    onStartShift: () => void;
    onEndShift: () => void;
    isLoading?: boolean;
}

export function ShiftControls({
    isShiftActive,
    shiftStartTime,
    onStartShift,
    onEndShift,
    isLoading = false,
}: ShiftControlsProps) {
    const formatStartTime = (date: Date) => {
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="time-outline" size={20} color="#3b82f6" />
                <Text style={styles.title}>My Shift</Text>
            </View>

            {isShiftActive && shiftStartTime && (
                <Text style={styles.shiftInfo}>
                    Started at {formatStartTime(shiftStartTime)}
                </Text>
            )}

            <View style={styles.actions}>
                {isShiftActive ? (
                    <TouchableOpacity
                        style={[styles.button, styles.endButton]}
                        onPress={onEndShift}
                        disabled={isLoading}
                    >
                        <Ionicons name="stop-circle-outline" size={20} color="#ef4444" />
                        <Text style={[styles.buttonText, styles.endButtonText]}>End Shift</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.button, styles.startButton]}
                        onPress={onStartShift}
                        disabled={isLoading}
                    >
                        <Ionicons name="play-circle-outline" size={20} color="#fff" />
                        <Text style={[styles.buttonText, styles.startButtonText]}>Start Shift</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginLeft: 8,
    },
    shiftInfo: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
    },
    startButton: {
        backgroundColor: '#10b981',
    },
    endButton: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    startButtonText: {
        color: '#fff',
    },
    endButtonText: {
        color: '#ef4444',
    },
});
