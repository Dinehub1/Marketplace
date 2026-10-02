import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

export interface DateInputProps {
    label?: string;
    value: Date;
    onChange: (date: Date) => void;
    mode: 'date' | 'time' | 'datetime';
    placeholder?: string;
    error?: string;
    containerStyle?: ViewStyle;
    required?: boolean;
    minimumDate?: Date;
    maximumDate?: Date;
}

export function DateInput({
    label,
    value,
    onChange,
    mode = 'date',
    placeholder,
    error,
    containerStyle,
    required,
    minimumDate,
    maximumDate,
}: DateInputProps) {
    const [show, setShow] = useState(false);
    const [tempDate, setTempDate] = useState<Date>(value);
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>(mode === 'time' ? 'time' : 'date');

    const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShow(false);
        }

        if (event.type === 'dismissed') {
            setShow(false);
            return;
        }

        if (selectedDate) {
            if (mode === 'datetime' && pickerMode === 'date') {
                setTempDate(selectedDate);
                setPickerMode('time');
                if (Platform.OS === 'android') {
                    setShow(true);
                }
            } else {
                const finalDate = mode === 'datetime' && pickerMode === 'time'
                    ? new Date(tempDate.setHours(selectedDate.getHours(), selectedDate.getMinutes()))
                    : selectedDate;
                onChange(finalDate);
                setShow(false);
                if (mode === 'datetime') {
                    setPickerMode('date');
                }
            }
        }
    };

    const showPicker = () => {
        setTempDate(value);
        if (mode === 'datetime') {
            setPickerMode('date');
        }
        setShow(true);
    };

    const formatValue = () => {
        if (!value) return placeholder || 'Select...';

        if (mode === 'date') {
            return value.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } else if (mode === 'time') {
            return value.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
            });
        } else {
            return value.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
    };

    const getIcon = () => {
        if (mode === 'time') return 'time-outline';
        return 'calendar-outline';
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={styles.label}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            )}
            <TouchableOpacity
                style={[styles.input, error && styles.inputError]}
                onPress={showPicker}
                activeOpacity={0.7}
            >
                <Ionicons name={getIcon()} size={20} color="#64748b" style={styles.icon} />
                <Text style={[styles.inputText, !value && styles.placeholder]}>
                    {formatValue()}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}

            {show && (
                <DateTimePicker
                    value={mode === 'datetime' && pickerMode === 'time' ? tempDate : value}
                    mode={pickerMode}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
        marginBottom: 8,
    },
    required: {
        color: '#ef4444',
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    icon: {
        marginRight: 12,
    },
    inputText: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
    },
    placeholder: {
        color: '#94a3b8',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },
});
