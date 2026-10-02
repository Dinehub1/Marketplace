import {
    Button,
    FormSection,
    ListItem,
    PageHeader,
    SectionTitle,
    TextInput
} from '@/components';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/hooks/useProfile';
import { showError } from '@/utils';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export function ProfileScreen() {
    const { profile: authProfile, currentRole, signOut, loadUserData } = useAuth();
    const { updateProfile } = useProfile(authProfile?.id);

    // Local state for form
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [fullName, setFullName] = useState(authProfile?.full_name || '');
    const [phone, setPhone] = useState(authProfile?.phone || '');

    // Sync state when profile changes
    useEffect(() => {
        if (authProfile) {
            setFullName(authProfile.full_name || '');
            setPhone(authProfile.phone || '');
        }
    }, [authProfile]);

    const handleSave = async () => {
        if (!authProfile?.id) return;
        if (!fullName.trim()) {
            showError('Full name is required');
            return;
        }

        setIsSaving(true);
        try {
            const success = await updateProfile({
                full_name: fullName.trim(),
                phone: phone.trim(),
            });

            if (success) {
                await loadUserData(); // Refresh global auth state
                setIsEditing(false);
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            showError(error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const renderRoleSpecificInfo = () => {
        const role = currentRole?.role;

        if (role === 'resident') {
            return (
                <>
                    <SectionTitle>Unit Information</SectionTitle>
                    <ListItem
                        icon="home-outline"
                        iconColor="#8b5cf6"
                        iconBackgroundColor="#ede9fe"
                        title="Unit"
                        subtitle={currentRole?.unit?.unit_number || 'Not assigned'}
                    />
                </>
            );
        }

        // For manager and guard
        return (
            <>
                <SectionTitle>Role Information</SectionTitle>
                <ListItem
                    icon="shield-checkmark-outline"
                    iconColor="#8b5cf6"
                    iconBackgroundColor="#ede9fe"
                    title="Designation"
                    subtitle={role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Staff'}
                />
            </>
        );
    };

    return (
        <View style={styles.container}>
            <PageHeader
                title="My Profile"
                subtitle={currentRole?.role || 'User'}
                rightAction={
                    isEditing
                        ? undefined
                        : {
                            icon: 'create-outline',
                            color: '#3b82f6',
                            onPress: () => setIsEditing(true),
                        }
                }
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <SectionTitle>Personal Information</SectionTitle>

                {isEditing ? (
                    <FormSection>
                        <TextInput
                            label="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter your name"
                        />
                        <TextInput
                            label="Phone Number"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Enter phone number"
                            keyboardType="phone-pad"
                        />
                        <View style={styles.buttonRow}>
                            <Button
                                title="Cancel"
                                variant="secondary"
                                onPress={() => {
                                    setFullName(authProfile?.full_name || '');
                                    setPhone(authProfile?.phone || '');
                                    setIsEditing(false);
                                }}
                                style={styles.button}
                            />
                            <Button
                                title="Save"
                                variant="primary"
                                onPress={handleSave}
                                loading={isSaving}
                                style={styles.button}
                            />
                        </View>
                    </FormSection>
                ) : (
                    <>
                        <ListItem
                            icon="person-outline"
                            iconColor="#3b82f6"
                            iconBackgroundColor="#dbeafe"
                            title="Full Name"
                            subtitle={authProfile?.full_name || 'Not set'}
                        />
                        <ListItem
                            icon="mail-outline"
                            iconColor="#10b981"
                            iconBackgroundColor="#d1fae5"
                            title="Email"
                            subtitle={authProfile?.email || 'Not set'}
                        />
                        <ListItem
                            icon="call-outline"
                            iconColor="#f59e0b"
                            iconBackgroundColor="#fef3c7"
                            title="Phone"
                            subtitle={authProfile?.phone || 'Not set'}
                        />
                    </>
                )}

                {renderRoleSpecificInfo()}

                <ListItem
                    icon="business-outline"
                    iconColor="#ec4899"
                    iconBackgroundColor="#fce7f3"
                    title="Society"
                    subtitle={currentRole?.society?.name || 'Not assigned'}
                />

                <SectionTitle>Account</SectionTitle>
                <ListItem
                    icon="log-out-outline"
                    iconColor="#ef4444"
                    iconBackgroundColor="#fee2e2"
                    title="Sign Out"
                    subtitle="Log out of your account"
                    onPress={signOut}
                />

                <View style={styles.spacer} />
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
        paddingHorizontal: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
    },
    spacer: {
        height: 40,
    },
});
