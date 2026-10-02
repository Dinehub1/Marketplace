import { Button, FormSection, PageHeader, TextInput } from '@/components';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/utils';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CreateAnnouncementScreen() {
    const router = useRouter();
    const { currentRole, profile } = useAuth();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState<'all' | 'role'>('all'); // Simplified for MVP
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sanitize input to prevent XSS
    const sanitizeInput = (input: string) => {
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .trim();
    };

    const handleSubmit = async () => {
        if (!title.trim() || !message.trim()) {
            showError('Please fill in all fields');
            return;
        }

        if (!currentRole?.society_id) {
            showError('Society context missing');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('announcements')
                .insert({
                    society_id: currentRole.society_id,
                    title: sanitizeInput(title),
                    message: sanitizeInput(message),
                    target_type: targetType,
                    created_by: profile?.id,
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days default
                });

            if (error) throw error;

            showSuccess('Announcement created successfully');
            router.back();
        } catch (error: any) {
            console.error('Error creating announcement:', error);
            showError(error.message || 'Failed to post announcement');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <PageHeader title="New Announcement" />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <FormSection title="Details">
                    <TextInput
                        label="Title"
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g., Water Supply Interrupt"
                    />

                    <TextInput
                        label="Message"
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Detailed message..."
                        multiline
                        numberOfLines={4}
                        style={{ height: 120 }}
                    />
                </FormSection>

                <FormSection title="Target Audience">
                    <View style={styles.typeContainer}>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                targetType === 'all' && styles.typeButtonActive,
                            ]}
                            onPress={() => setTargetType('all')}
                        >
                            <Text
                                style={[
                                    styles.typeText,
                                    targetType === 'all' && styles.typeTextActive,
                                ]}
                            >
                                All Residents
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                targetType === 'role' && styles.typeButtonActive,
                            ]}
                            onPress={() => setTargetType('role')}
                        >
                            <Text
                                style={[
                                    styles.typeText,
                                    targetType === 'role' && styles.typeTextActive,
                                ]}
                            >
                                Staff Only
                            </Text>
                        </TouchableOpacity>
                    </View>
                </FormSection>

                <Button
                    title="Post Announcement"
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    style={styles.submitButton}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    typeTextActive: {
        color: '#3b82f6',
    },
    submitButton: {
        marginTop: 32,
        marginBottom: 40,
    },
});
