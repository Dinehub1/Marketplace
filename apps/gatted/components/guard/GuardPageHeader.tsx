import { Branding } from '@/constants/branding';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ShiftStatusBadge } from './ShiftStatusBadge';

interface GuardPageHeaderProps {
    guardName: string;
    societyName: string;
    isShiftActive: boolean;
    shiftDuration?: string;
    onNotificationPress: () => void;
    onProfilePress: () => void;
}

const brand = Branding.colors;

export function GuardPageHeader({
    guardName,
    societyName,
    isShiftActive,
    shiftDuration,
    onNotificationPress,
    onProfilePress,
}: GuardPageHeaderProps) {
    return (
        <LinearGradient
            colors={brand.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
        >
            <View style={styles.headerLeft}>
                <Text style={styles.name}>{guardName}</Text>
                <Text style={styles.role}>Gate Guard • {societyName}</Text>
                <ShiftStatusBadge isActive={isShiftActive} duration={shiftDuration} />
            </View>
            <View style={styles.headerRight}>
                <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
                    <Ionicons name="notifications-outline" size={22} color={brand.textOnDark} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onProfilePress} style={styles.iconButton}>
                    <Ionicons name="person-circle-outline" size={24} color={brand.neon} />
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(163, 230, 53, 0.18)',
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Branding.colors.textOnDark,
    },
    role: {
        fontSize: 14,
        color: Branding.colors.mutedOnDark,
        marginTop: 2,
    },
    iconButton: {
        padding: 9,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.10)',
    },
});
