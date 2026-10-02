import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Animated,
    StyleSheet,
    TextInput,
    TextStyle,
    TouchableOpacity,
    ViewStyle
} from 'react-native';

interface SearchInputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    onSearch?: (text: string) => void;
    onClear?: () => void;
    style?: ViewStyle;
    inputStyle?: TextStyle;
    size?: 'sm' | 'default' | 'lg';
    disabled?: boolean;
    showSearchIcon?: boolean;
    showClearButton?: boolean;
    autoFocus?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
    placeholder = 'Search...',
    value,
    onChangeText,
    onSearch,
    onClear,
    style,
    inputStyle,
    size = 'default',
    disabled = false,
    showSearchIcon = true,
    showClearButton = true,
    autoFocus = false,
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

    const handleClear = () => {
        onChangeText?.('');
        onClear?.();
    };

    const handleSubmit = () => {
        if (value && onSearch) {
            onSearch(value);
        }
    };

    const getBorderColor = () => {
        if (isFocused) return '#18181b'; // slate-900
        return '#d4d4d8'; // zinc-300
    };

    const getContainerStyle = () => [
        styles.container,
        styles[size],
        {
            borderColor: getBorderColor(),
            shadowOpacity: isFocused ? 0.1 : 0.05,
        },
        disabled && styles.disabled,
        style,
    ];

    const getInputStyle = () => [
        styles.input,
        styles[`${size}Input`],
        disabled && styles.disabledInput,
        inputStyle,
    ];

    return (
        <Animated.View style={getContainerStyle()}>
            {showSearchIcon && (
                <TouchableOpacity 
                    style={styles.searchIcon}
                    onPress={handleSubmit}
                    disabled={disabled}
                >
                    <Ionicons 
                        name="search" 
                        size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
                        color={isFocused ? '#18181b' : '#71717a'} // slate-900 : zinc-500
                    />
                </TouchableOpacity>
            )}
            
            <TextInput
                style={getInputStyle()}
                placeholder={placeholder}
                placeholderTextColor="#a1a1aa" // zinc-400
                value={value}
                onChangeText={onChangeText}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onSubmitEditing={handleSubmit}
                editable={!disabled}
                autoFocus={autoFocus}
                returnKeyType="search"
                clearButtonMode="never" // We'll handle this ourselves
            />
            
            {showClearButton && value && value.length > 0 && (
                <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={handleClear}
                    disabled={disabled}
                >
                    <Ionicons 
                        name="close-circle" 
                        size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
                        color="#71717a" // zinc-500
                    />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 24, // rounded-full
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    input: {
        flex: 1,
        color: '#18181b', // slate-900
        fontSize: 16, // text-base
    },
    searchIcon: {
        paddingLeft: 16,
        paddingRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButton: {
        paddingRight: 16,
        paddingLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabled: {
        backgroundColor: '#f4f4f5', // zinc-100
        opacity: 0.5,
    },
    disabledInput: {
        color: '#a1a1aa', // zinc-400
    },

    // Sizes
    sm: {
        minHeight: 36,
        paddingVertical: 6, // py-1.5
    },
    default: {
        minHeight: 44,
        paddingVertical: 10, // py-2.5
    },
    lg: {
        minHeight: 52,
        paddingVertical: 14, // py-3.5
    },

    // Input sizes
    smInput: {
        fontSize: 14, // text-sm
        paddingHorizontal: 8, // px-2
    },
    defaultInput: {
        fontSize: 16, // text-base
        paddingHorizontal: 12, // px-3
    },
    lgInput: {
        fontSize: 18, // text-lg
        paddingHorizontal: 16, // px-4
    },
});

