import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { StatusBadge } from '../../Card';

type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface IssueCardProps {
    title: string;
    description?: string;
    category?: string;
    priority?: IssuePriority;
    status: string;
    createdAt?: string;
    imageUrl?: string;
    onPress?: () => void;
    style?: ViewStyle;
}

const priorityColors: Record<IssuePriority, { bg: string; text: string }> = {
    low: { bg: '#d1fae5', text: '#10b981' },
    medium: { bg: '#fef3c7', text: '#f59e0b' },
    high: { bg: '#fee2e2', text: '#ef4444' },
    urgent: { bg: '#fce7f3', text: '#ec4899' },
};

export function IssueCard({
    title,
    description,
    category,
    priority = 'medium',
    status,
    createdAt,
    imageUrl,
    onPress,
    style,
}: IssueCardProps) {
    const Container = onPress ? TouchableOpacity : View;
    const priorityStyle = priorityColors[priority];

    return (
        <Container style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={2}>{title}</Text>
                    <StatusBadge status={status} variant="issue" />
                </View>
                {category && (
                    <View style={styles.category}>
                        <Ionicons name="folder-outline" size={14} color="#64748b" />
                        <Text style={styles.categoryText}>{category}</Text>
                    </View>
                )}
            </View>

            {description && (
                <Text style={styles.description} numberOfLines={2}>{description}</Text>
            )}

            {imageUrl && (
                <Image source={{ uri: imageUrl }} style={styles.image} />
            )}

            <View style={styles.footer}>
                <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
                    <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
                        {priority.toUpperCase()}
                    </Text>
                </View>
                {createdAt && (
                    <Text style={styles.date}>{createdAt}</Text>
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
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginRight: 12,
    },
    category: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    categoryText: {
        fontSize: 13,
        color: '#64748b',
        marginLeft: 4,
    },
    description: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 12,
    },
    image: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '600',
    },
    date: {
        fontSize: 13,
        color: '#94a3b8',
    },
});
