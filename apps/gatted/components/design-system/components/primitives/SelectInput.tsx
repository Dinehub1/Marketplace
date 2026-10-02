import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

export interface SelectOption {
    label: string;
    value: string;
}

export interface SelectInputProps {
    label?: string;
    placeholder?: string;
    value?: string;
    options: SelectOption[];
    onSelect: (value: string) => void;
    error?: string;
    containerStyle?: ViewStyle;
    required?: boolean;
}

export function SelectInput({
    label,
    placeholder = 'Select an option',
    value,
    options,
    onSelect,
    error,
    containerStyle,
    required,
}: SelectInputProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={styles.label}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            )}
            <TouchableOpacity
                style={[styles.select, error && styles.selectError]}
                onPress={() => setIsOpen(!isOpen)}
                activeOpacity={0.7}
            >
                <Text style={[styles.selectText, !selectedOption && styles.placeholder]}>
                    {selectedOption?.label || placeholder}
                </Text>
                <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#64748b"
                />
            </TouchableOpacity>

            {isOpen && (
                <View style={styles.dropdown}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.option,
                                option.value === value && styles.selectedOption,
                            ]}
                            onPress={() => {
                                onSelect(option.value);
                                setIsOpen(false);
                            }}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    option.value === value && styles.selectedOptionText,
                                ]}
                            >
                                {option.label}
                            </Text>
                            {option.value === value && (
                                <Ionicons name="checkmark" size={20} color="#3b82f6" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        zIndex: 1,
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
    select: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    selectError: {
        borderColor: '#ef4444',
    },
    selectText: {
        fontSize: 16,
        color: '#1e293b',
    },
    placeholder: {
        color: '#94a3b8',
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 100,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    selectedOption: {
        backgroundColor: '#eff6ff',
    },
    optionText: {
        fontSize: 16,
        color: '#1e293b',
    },
    selectedOptionText: {
        color: '#3b82f6',
        fontWeight: '500',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },
});
