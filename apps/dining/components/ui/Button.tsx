import React from 'react';
import {
    Animated,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

interface ButtonProps {
    children: React.ReactNode;
    onPress: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    onPress,
    variant = 'default',
    size = 'default',
    disabled = false,
    style,
    textStyle,
    fullWidth = false,
    icon,
}) => {
    const scaleValue = React.useRef(new Animated.Value(1)).current;
    const opacityValue = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (!disabled) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 0.96,
                    useNativeDriver: true,
                    speed: 20,
                    bounciness: 4,
                }),
                Animated.timing(opacityValue, {
                    toValue: 0.8,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    };

    const handlePressOut = () => {
        if (!disabled) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 20,
                    bounciness: 4,
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    };

    const getButtonStyle = () => [
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
    ];

    const getTextStyle = () => [
        styles.text,
        styles[`${variant}Text`],
        styles[`${size}Text`],
        disabled && styles.disabledText,
        textStyle,
    ];

    return (
        <Animated.View
            style={{
                transform: [{ scale: scaleValue }],
                opacity: opacityValue,
            }}
        >
            <TouchableOpacity
                style={getButtonStyle()}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                activeOpacity={1}
            >
                {icon && (
                    React.isValidElement(icon) ? icon : <Text style={getTextStyle()}>{icon}</Text>
                )}
                {typeof children === 'string' ? (
                    <Text style={getTextStyle()}>{children}</Text>
                ) : (
                    children
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16, // rounded-2xl equivalent
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
    },

    // Variants
    default: {
        backgroundColor: '#18181b', // slate-900
        borderWidth: 0,
        shadowOpacity: 0.1,
        elevation: 3,
        paddingHorizontal: 16, // px-4
        paddingVertical: 12, // py-3
        minHeight: 44,
    },
    destructive: {
        backgroundColor: '#dc2626', // red-600
        borderWidth: 0,
        shadowOpacity: 0.1,
        elevation: 3,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#d4d4d8', // zinc-300
        shadowOpacity: 0,
        elevation: 0,
    },
    secondary: {
        backgroundColor: '#f4f4f5', // zinc-100
        borderWidth: 0,
        shadowOpacity: 0.05,
        elevation: 1,
    },
    ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        shadowOpacity: 0,
        elevation: 0,
    },
    link: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        shadowOpacity: 0,
        elevation: 0,
    },

    // Sizes
    sm: {
        paddingHorizontal: 12, // px-3
        paddingVertical: 8, // py-2
        minHeight: 36,
        borderRadius: 12,
    },
    lg: {
        paddingHorizontal: 24, // px-6
        paddingVertical: 16, // py-4
        minHeight: 52,
        borderRadius: 20,
    },
    icon: {
        width: 44,
        height: 44,
        paddingHorizontal: 0,
        paddingVertical: 0,
        borderRadius: 22,
    },

    // Text styles
    text: {
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 16, // text-base
    },
    defaultText: {
        color: '#fafafa', // zinc-50
    },
    destructiveText: {
        color: '#fafafa', // zinc-50
    },
    outlineText: {
        color: '#18181b', // slate-900
    },
    secondaryText: {
        color: '#18181b', // slate-900
    },
    ghostText: {
        color: '#18181b', // slate-900
    },
    linkText: {
        color: '#18181b', // slate-900
        textDecorationLine: 'underline',
    },
    disabledText: {
        color: '#a1a1aa', // zinc-400
    },

    // Text sizes  
    defaultTextSize: {
        fontSize: 16, // text-base
    },
    smText: {
        fontSize: 14, // text-sm
    },
    lgText: {
        fontSize: 18, // text-lg
    },
    iconText: {
        fontSize: 0, // hidden
    },
});

