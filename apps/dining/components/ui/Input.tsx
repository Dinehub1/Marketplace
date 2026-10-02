import React, { useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

interface InputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    style?: ViewStyle;
    inputStyle?: TextStyle;
    variant?: 'default' | 'filled' | 'outlined';
    size?: 'sm' | 'default' | 'lg';
    disabled?: boolean;
    error?: string;
    label?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    multiline?: boolean;
    numberOfLines?: number;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    secureTextEntry?: boolean;
    maxLength?: number;
}

export const Input: React.FC<InputProps> = ({
    placeholder,
    value,
    onChangeText,
    style,
    inputStyle,
    variant = 'default',
    size = 'default',
    disabled = false,
    error,
    label,
    leftIcon,
    rightIcon,
    multiline = false,
    numberOfLines = 1,
    keyboardType = 'default',
    secureTextEntry = false,
    maxLength,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = React.useRef(new Animated.Value(0)).current;

    const handleFocus = () => {
        setIsFocused(true);
        Animated.timing(focusAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    const handleBlur = () => {
        setIsFocused(false);
        Animated.timing(focusAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    const getBorderColor = () => {
        if (error) return '#dc2626'; // red-600
        if (isFocused) return '#18181b'; // slate-900
        return '#d4d4d8'; // zinc-300
    };

    const getContainerStyle = () => [
        styles.container,
        styles[variant],
        styles[size],
        {
            borderColor: getBorderColor(),
        },
        disabled && styles.disabled,
        error && styles.error,
        style,
    ];

    const getInputStyle = () => [
        styles.input,
        styles[`${size}Input`],
        disabled && styles.disabledInput,
        inputStyle,
    ];

    return (
        <View style={styles.wrapper}>
            {label && <Text style={styles.label}>{label}</Text>}
            <Animated.View style={getContainerStyle()}>
                {leftIcon && (
                    <View style={styles.leftIcon}>
                        {leftIcon}
                    </View>
                )}
                <TextInput
                    style={getInputStyle()}
                    placeholder={placeholder}
                    placeholderTextColor="#a1a1aa" // zinc-400
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    editable={!disabled}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    maxLength={maxLength}
                />
                {rightIcon && (
                    <View style={styles.rightIcon}>
                        {rightIcon}
                    </View>
                )}
            </Animated.View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    label: {
        fontSize: 14, // text-sm
        fontWeight: '500',
        color: '#18181b', // slate-900
        marginBottom: 8, // mb-2
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12, // rounded-xl
        borderWidth: 1,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    input: {
        flex: 1,
        fontSize: 16, // text-base
        color: '#18181b', // slate-900
    },
    leftIcon: {
        paddingLeft: 12,
        paddingRight: 8,
    },
    rightIcon: {
        paddingRight: 12,
        paddingLeft: 8,
    },
    disabled: {
        backgroundColor: '#f4f4f5', // zinc-100
        opacity: 0.5,
    },
    disabledInput: {
        color: '#a1a1aa', // zinc-400
    },
    error: {
        borderColor: '#dc2626', // red-600
    },
    errorText: {
        fontSize: 12, // text-xs
        color: '#dc2626', // red-600
        marginTop: 4, // mt-1
        marginLeft: 4,
    },

    // Variants
    default: {
        backgroundColor: '#ffffff',
        minHeight: 44,
        paddingVertical: 12, // py-3
    },
    filled: {
        backgroundColor: '#f4f4f5', // zinc-100
        borderColor: 'transparent',
    },
    outlined: {
        backgroundColor: 'transparent',
        borderWidth: 2,
    },

    // Sizes
    sm: {
        minHeight: 36,
        paddingVertical: 8, // py-2
    },

    lg: {
        minHeight: 52,
        paddingVertical: 16, // py-4
    },

    // Input sizes
    smInput: {
        fontSize: 14, // text-sm
        paddingHorizontal: 12, // px-3
    },
    defaultInput: {
        fontSize: 16, // text-base
        paddingHorizontal: 16, // px-4
    },
    lgInput: {
        fontSize: 18, // text-lg
        paddingHorizontal: 20, // px-5
    },
});

