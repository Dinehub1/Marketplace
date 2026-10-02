import React, { useCallback, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { AppColors } from '../../constants/Colors';

export interface RippleButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    style?: ViewStyle;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    rippleColor?: string;
}

interface Ripple {
    id: number;
    x: number;
    y: number;
    scale: Animated.Value;
    opacity: Animated.Value;
}

export const RippleButton: React.FC<RippleButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    style,
    icon,
    fullWidth = false,
    rippleColor,
}) => {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const buttonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);
    const scaleValue = useRef(new Animated.Value(1)).current;

    const createRipple = useCallback((event: any) => {
        if (!buttonRef.current || disabled) return;

        // Get touch coordinates relative to button
        const { locationX, locationY } = event.nativeEvent;
        
        const newRipple: Ripple = {
            id: Date.now(),
            x: locationX - 10, // Adjust for ripple size
            y: locationY - 10,
            scale: new Animated.Value(0),
            opacity: new Animated.Value(0.6),
        };

        setRipples(prev => [...prev, newRipple]);

        // Animate ripple
        Animated.parallel([
            Animated.timing(newRipple.scale, {
                toValue: 10,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(newRipple.opacity, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Remove ripple after animation
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        });
    }, [disabled]);

    const handlePressIn = (event: any) => {
        createRipple(event);
        Animated.spring(scaleValue, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
        }).start();
    };

    const getButtonStyle = () => [
        styles.button,
        styles[`${variant}Button`],
        styles[`${size}Button`],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
    ];

    const getTextStyle = () => [
        styles.text,
        styles[`${variant}Text`],
        styles[`${size}Text`],
        disabled && styles.disabledText,
    ];

    const getRippleColor = () => {
        if (rippleColor) return rippleColor;
        switch (variant) {
            case 'primary':
                return 'rgba(255, 255, 255, 0.3)';
            case 'outline':
                return AppColors.primary + '30';
            case 'secondary':
                return AppColors.gray[400] + '30';
            case 'ghost':
                return AppColors.gray[300] + '30';
            default:
                return 'rgba(255, 255, 255, 0.3)';
        }
    };

    return (
        <Animated.View
            style={{
                transform: [{ scale: scaleValue }],
            }}
        >
            <TouchableOpacity
                ref={buttonRef}
                style={getButtonStyle()}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                activeOpacity={1}
            >
                {/* Ripple effects */}
                {ripples.map((ripple) => (
                    <Animated.View
                        key={ripple.id}
                        style={[
                            styles.ripple,
                            {
                                left: ripple.x,
                                top: ripple.y,
                                backgroundColor: getRippleColor(),
                                transform: [{ scale: ripple.scale }],
                                opacity: ripple.opacity,
                            },
                        ]}
                    />
                ))}
                
                {/* Button content */}
                <View style={styles.content}>
                    {icon && <>{icon}</>}
                    <Text style={getTextStyle()}>{title}</Text>
                </View>
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
    ripple: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        pointerEvents: 'none',
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
