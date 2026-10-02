import React from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { AppColors } from '../../constants/Colors';

export interface ModernButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    style?: ViewStyle;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    style,
    icon,
    fullWidth = false,
}) => {
    const scaleValue = React.useRef(new Animated.Value(1)).current;
    const opacityValue = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: 0.95,
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
    };

    const handlePressOut = () => {
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
    };

    const getButtonStyle = () => {
        const baseStyle = [
            styles.button,
            styles[`${variant}Button`],
            styles[`${size}Button`],
            fullWidth && styles.fullWidth,
            disabled && styles.disabled,
            style,
        ];
        return baseStyle;
    };

    const getTextStyle = () => [
        styles.text,
        styles[`${variant}Text`],
        styles[`${size}Text`],
        disabled && styles.disabledText,
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
                {icon && <>{icon}</>}
                <Text style={getTextStyle()}>{title}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        gap: 8,
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
    primaryButton: {
        backgroundColor: AppColors.primary,
        borderWidth: 0,
    },
    secondaryButton: {
        backgroundColor: AppColors.gray[100],
        borderWidth: 1,
        borderColor: AppColors.gray[200],
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: AppColors.primary,
    },
    ghostButton: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        shadowOpacity: 0,
        elevation: 0,
    },

    // Sizes
    smButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    mdButton: {
        paddingHorizontal:16,
        paddingVertical: 12,
        borderRadius: 10,
    },
    lgButton: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
    },

    // Text styles
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
    primaryText: {
        color: AppColors.white,
    },
    secondaryText: {
        color: AppColors.gray[700],
    },
    outlineText: {
        color: AppColors.primary,
    },
    ghostText: {
        color: AppColors.gray[600],
    },
    disabledText: {
        color: AppColors.gray[400],
    },

    // Text sizes
    smText: {
        fontSize: 12,
    },
    mdText: {
        fontSize: 14,
    },
    lgText: {
        fontSize: 16,
    },
});
