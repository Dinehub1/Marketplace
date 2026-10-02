import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StatusBadgeProps {
    status: string;
    variant?: 'visitor' | 'issue';
}

export function StatusBadge({ status, variant = 'visitor' }: StatusBadgeProps) {
    const getStatusStyle = () => {
        if (variant === 'visitor') {
            switch (status) {
                case 'pending':
                    return { bg: '#fef3c7', text: '#f59e0b' };
                case 'approved':
                    return { bg: '#d1fae5', text: '#10b981' };
                case 'checked-in':
                    return { bg: '#dbeafe', text: '#3b82f6' };
                case 'checked-out':
                    return { bg: '#f3f4f6', text: '#6b7280' };
                case 'rejected':
                    return { bg: '#fee2e2', text: '#ef4444' };
                default:
                    return { bg: '#f3f4f6', text: '#6b7280' };
            }
        } else {
            switch (status) {
                case 'open':
                    return { bg: '#fee2e2', text: '#ef4444' };
                case 'in-progress':
                    return { bg: '#fef3c7', text: '#f59e0b' };
                case 'resolved':
                    return { bg: '#d1fae5', text: '#10b981' };
                case 'closed':
                    return { bg: '#f3f4f6', text: '#6b7280' };
                default:
                    return { bg: '#f3f4f6', text: '#6b7280' };
            }
        }
    };

    const style = getStatusStyle();

    return (
        <View style={[styles.badge, { backgroundColor: style.bg }]}>
            <Text style={[styles.badgeText, { color: style.text }]}>
                {status.replace('-', ' ').toUpperCase()}
            </Text>
        </View>
    );
}

interface CardProps {
    children: React.ReactNode;
    onPress?: () => void;
}

export function Card({ children, onPress }: CardProps) {
    const Container = onPress ? TouchableOpacity : View;
    return (
        <Container style={styles.card} onPress={onPress} activeOpacity={0.7}>
            {children}
        </Container>
    );
}

interface CardHeaderProps {
    title: string;
    subtitle?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
}

export function CardHeader({ title, subtitle, icon, iconColor = '#64748b' }: CardHeaderProps) {
    return (
        <View style={styles.cardHeader}>
            {icon && (
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={24} color={iconColor} />
                </View>
            )}
            <View style={styles.headerText}>
                <Text style={styles.cardTitle}>{title}</Text>
                {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
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
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
});
