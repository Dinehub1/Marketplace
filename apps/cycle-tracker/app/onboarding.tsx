import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCycleData, useOnboarding, useUserProfile } from '@/hooks/use-storage';

const { width } = Dimensions.get('window');

const KeyboardDismissWrapper = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS === 'web') {
        return <>{children}</>;
    }
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            {children}
        </TouchableWithoutFeedback>
    );
};

export default function OnboardingScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Hooks
    const { saveData } = useCycleData();
    const { updateProfile } = useUserProfile();
    const { completeOnboarding } = useOnboarding();

    // State
    const [step, setStep] = useState(0);
    const [userName, setUserName] = useState('');
    const [lastPeriodDate, setLastPeriodDate] = useState('');
    const [cycleLength, setCycleLength] = useState('28');
    const [periodLength, setPeriodLength] = useState('5');
    const [validationError, setValidationError] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const validateAndSetCycleLength = (val: string) => {
        setCycleLength(val);
        setValidationError('');
    };

    const validateAndSetPeriodLength = (val: string) => {
        setPeriodLength(val);
        setValidationError('');
    };

    const clampOnBlurCycle = () => {
        const num = parseInt(cycleLength);
        if (isNaN(num) || num < 15) {
            setCycleLength('15');
            setValidationError('Cycle length must be at least 15 days.');
        } else if (num > 60) {
            setCycleLength('60');
            setValidationError('Cycle length cannot exceed 60 days.');
        }
    };

    const clampOnBlurPeriod = () => {
        const num = parseInt(periodLength);
        const maxPeriod = Math.min(10, (parseInt(cycleLength) || 28) - 1);
        if (isNaN(num) || num < 1) {
            setPeriodLength('1');
            setValidationError('Period length must be at least 1 day.');
        } else if (num > maxPeriod) {
            setPeriodLength(String(maxPeriod));
            setValidationError(`Period length cannot exceed ${maxPeriod} days.`);
        }
    };

    const handleNext = () => {
        if (step === 3) {
            handleFinish();
        } else {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        } else {
            // Optional: Handle back from first step (e.g., exit app or do nothing)
        }
    };

    const handleFinish = async () => {
        try {
            // Save Cycle Data
            await saveData({
                lastPeriodStart: lastPeriodDate,
                cycleLength: parseInt(cycleLength) || 28,
                periodLength: parseInt(periodLength) || 5,
                entries: [],
            });

            // Save User Profile Settings
            await updateProfile({
                name: userName.trim(),
                notificationsEnabled,
            });

            // Mark Onboarding as Complete
            await completeOnboarding();

            console.log('Onboarding Saved & Complete');
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Failed to save onboarding data:', error);
        }
    };

    const isNextDisabled = () => {
        if (step === 0 && !userName.trim()) return true;
        if (step === 1 && !lastPeriodDate) return true;
        if (step === 2 && (!cycleLength || !periodLength)) return true;
        return false;
    };

    // --- Steps Components ---

    const renderWelcomeStep = () => (
        <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
                <Ionicons name="rose-outline" size={80} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Welcome to Cycle</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Track your cycle, understand your body, and live in sync with your rhythm.
            </Text>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>What should we call you?</Text>
                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundTertiary }]}
                    value={userName}
                    onChangeText={setUserName}
                    placeholder="Your name"
                    placeholderTextColor={colors.textTertiary}
                    autoFocus
                />
            </View>
        </View>
    );

    const renderCalendarStep = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Last Period?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Select the first day of your last menstrual cycle.
            </Text>
            <View style={[styles.calendarWrapper, { backgroundColor: colors.cardBackground, shadowColor: colors.text }]}>
                <Calendar
                    onDayPress={(day: { dateString: React.SetStateAction<string>; }) => setLastPeriodDate(day.dateString)}
                    markedDates={{
                        [lastPeriodDate]: {
                            selected: true,
                            disableTouchEvent: true,
                            selectedColor: colors.primary,
                            selectedTextColor: '#ffffff',
                        },
                    }}
                    theme={{
                        backgroundColor: colors.cardBackground,
                        calendarBackground: colors.cardBackground,
                        textSectionTitleColor: colors.textSecondary,
                        selectedDayBackgroundColor: colors.primary,
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: colors.primary,
                        dayTextColor: colors.text,
                        textDisabledColor: colors.textTertiary,
                        dotColor: colors.primary,
                        arrowColor: colors.primary,
                        monthTextColor: colors.text,
                        indicatorColor: colors.primary,
                        textDayFontFamily: 'Manrope_400Regular',
                        textMonthFontFamily: 'Manrope_700Bold',
                        textDayHeaderFontFamily: 'Manrope_700Bold',
                        textDayFontSize: 16,
                        textMonthFontSize: 18,
                        textDayHeaderFontSize: 14,
                    }}
                    style={styles.calendar}
                />
            </View>
        </View>
    );

    const renderGoalsStep = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Your Cycle</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Help us predict your next period by entering your average cycle details.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Average Cycle Length (Days)</Text>
                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundTertiary }]}
                    value={cycleLength}
                    onChangeText={validateAndSetCycleLength}
                    onBlur={clampOnBlurCycle}
                    keyboardType="number-pad"
                    maxLength={2}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Period Duration (Days)</Text>
                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundTertiary }]}
                    value={periodLength}
                    onChangeText={validateAndSetPeriodLength}
                    onBlur={clampOnBlurPeriod}
                    keyboardType="number-pad"
                    maxLength={2}
                />
            </View>

            {validationError ? (
                <Text style={[styles.validationError, { color: colors.error }]}>{validationError}</Text>
            ) : null}
        </View>
    );

    const renderNotificationStep = () => (
        <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
                <Ionicons name="notifications-outline" size={80} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Stay in the Loop</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Get gentle reminders for your period, fertile window, and daily logs.
            </Text>

            <View style={[styles.settingRow, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>Enable Notifications</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                        You can change this later in settings.
                    </Text>
                </View>
                <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={'#FFFFFF'}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <KeyboardDismissWrapper>
                    <View style={styles.content}>
                        {/* Header / Progress */}
                        <View style={styles.header}>
                            {step > 0 && (
                                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                                </TouchableOpacity>
                            )}
                            <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                                <View style={[styles.progressBarFill, { width: `${((step + 1) / 4) * 100}%`, backgroundColor: colors.primary }]} />
                            </View>
                            <View style={{ width: 40 }} />{/* Spacer for alignment */}
                        </View>

                        {/* Step Content */}
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {step === 0 && renderWelcomeStep()}
                            {step === 1 && renderCalendarStep()}
                            {step === 2 && renderGoalsStep()}
                            {step === 3 && renderNotificationStep()}
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    { backgroundColor: colors.primary },
                                    isNextDisabled() && styles.buttonDisabled
                                ]}
                                onPress={handleNext}
                                disabled={isNextDisabled()}
                            >
                                <Text style={styles.buttonText}>
                                    {step === 0 ? 'Get Started' : step === 3 ? 'Finish' : 'Continue'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardDismissWrapper>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 4,
    },
    progressBarBackground: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        marginHorizontal: 20,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    stepContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400, // Ensure content is centered vertically comfortably
    },
    iconContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Manrope_700Bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Manrope_400Regular',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    calendarWrapper: {
        width: '100%',
        borderRadius: 16,
        padding: 10,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    calendar: {
        borderRadius: 12,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Manrope_600SemiBold',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 18,
        fontFamily: 'Manrope_500Medium',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        width: '100%',
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 16,
        fontFamily: 'Manrope_600SemiBold',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 14,
        fontFamily: 'Manrope_400Regular',
    },
    footer: {
        padding: 24,
    },
    button: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    validationError: {
        fontSize: 13,
        fontFamily: 'Manrope_400Regular',
        textAlign: 'center',
        marginTop: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Manrope_700Bold',
    },
});
