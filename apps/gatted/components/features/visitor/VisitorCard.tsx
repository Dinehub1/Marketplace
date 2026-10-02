import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { StatusBadge } from '../../Card';

export interface VisitorCardProps {
    name: string;
    phone?: string;
    purpose?: string;
    expectedDate?: string;
    expectedTime?: string;
    status: string;
    unit?: string;
    onPress?: () => void;
    style?: ViewStyle;
}

export function VisitorCard({
    name,
    phone,
    purpose,
    expectedDate,
    expectedTime,
    status,
    unit,
    onPress,
    style,
}: VisitorCardProps) {
    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={24} color="#64748b" />
                </View>
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    {phone && <Text style={styles.phone}>{phone}</Text>}
                </View>
                <StatusBadge status={status} variant="visitor" />
            </View>

            <View style={styles.details}>
                {purpose && (
                    <View style={styles.detailRow}>
                        <Ionicons name="briefcase-outline" size={16} color="#64748b" />
                        <Text style={styles.detailText}>{purpose}</Text>
                    </View>
                )}
                {(expectedDate || expectedTime) && (
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#64748b" />
                        <Text style={styles.detailText}>
                            {expectedDate} {expectedTime && `at ${expectedTime}`}
                        </Text>
                    </View>
                )}
                {unit && (
                    <View style={styles.detailRow}>
                        <Ionicons name="home-outline" size={16} color="#64748b" />
                        <Text style={styles.detailText}>Unit {unit}</Text>
                    </View>
                )}
            </View>
        </Container>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    phone: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
    details: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailText: {
        fontSize: 14,
        color: '#64748b',
        marginLeft: 8,
    },
});
