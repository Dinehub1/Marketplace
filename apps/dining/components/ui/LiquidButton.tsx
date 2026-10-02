import React from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { AppColors } from '../../constants/Colors';

export interface LiquidButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'outline' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    style?: ViewStyle;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
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
    const liquidValue = React.useRef(new Animated.Value(0)).current;
    const opacityValue = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: 0.96,
                useNativeDriver: true,
                speed: 20,
                bounciness: 4,
            }),
            Animated.timing(liquidValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
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
            Animated.timing(liquidValue, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const handleHoverIn = () => {
        Animated.timing(liquidValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const handleHoverOut = () => {
        Animated.timing(liquidValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const liquidWidth = liquidValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

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

    const getLiquidStyle = () => [
        styles.liquidFill,
        styles[`${variant}Liquid`],
        {
            width: liquidWidth,
        },
    ];

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
                <Animated.View style={getLiquidStyle()} />
                <Animated.View style={styles.content}>
                    {icon}
                    <Text style={getTextStyle()}>{title}</Text>
                </Animated.View>
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
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
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
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        zIndex: 2,
    },
    liquidFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        zIndex: 1,
    },
    
    // Variants
    primaryButton: {
        backgroundColor: AppColors.gray[100],
        borderWidth: 1,
        borderColor: AppColors.gray[200],
    },
    primaryLiquid: {
        backgroundColor: AppColors.primary,
    },
    outlineButton: {
        backgroundColor: AppColors.white,
        borderWidth: 1.5,
        borderColor: AppColors.primary,
    },
    outlineLiquid: {
        backgroundColor: AppColors.primary,
    },
    secondaryButton: {
        backgroundColor: AppColors.gray[100],
        borderWidth: 1,
        borderColor: AppColors.gray[200],
    },
    secondaryLiquid: {
        backgroundColor: AppColors.gray[300],
    },

    // Sizes
    smButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    mdButton: {
        paddingHorizontal: 16,
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
        zIndex: 3,
    },
    primaryText: {
        color: AppColors.primary,
    },
    outlineText: {
        color: AppColors.primary,
    },
    secondaryText: {
        color: AppColors.gray[700],
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
