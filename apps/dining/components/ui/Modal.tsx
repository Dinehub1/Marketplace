import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal as RNModal,
    StyleSheet,
    TouchableOpacity,
    ViewStyle
} from 'react-native';

const { height } = Dimensions.get('window');

interface ModalProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    variant?: 'center' | 'bottom' | 'fullscreen';
    size?: 'sm' | 'default' | 'lg' | 'xl';
    showCloseButton?: boolean;
    closeOnBackdrop?: boolean;
    animationType?: 'fade' | 'slide' | 'none';
    style?: ViewStyle;
    backdropStyle?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
    visible,
    onClose,
    children,
    variant = 'center',
    size = 'default',
    showCloseButton = true,
    closeOnBackdrop = true,
    animationType = 'fade',
    style,
    backdropStyle,
}) => {
    const slideAnim = useRef(new Animated.Value(variant === 'bottom' ? height : 0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (visible) {
            const animations = [
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250, // Slightly faster
                    useNativeDriver: true,
                }),
            ];

            if (variant === 'bottom') {
                // Optimized: Use timing instead of spring for more predictable performance
                animations.push(
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    })
                );
            } else if (variant === 'center') {
                // Optimized: Use timing instead of spring for 60 FPS
                animations.push(
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 250,
                        useNativeDriver: true,
                    })
                );
            }

            Animated.parallel(animations).start();
        } else {
            const animations = [
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 180, // Faster exit
                    useNativeDriver: true,
                }),
            ];

            if (variant === 'bottom') {
                animations.push(
                    Animated.timing(slideAnim, {
                        toValue: height,
                        duration: 200, // Faster exit
                        useNativeDriver: true,
                    })
                );
            } else if (variant === 'center') {
                animations.push(
                    Animated.timing(scaleAnim, {
                        toValue: 0.9,
                        duration: 180, // Faster exit
                        useNativeDriver: true,
                    })
                );
            }

            Animated.parallel(animations).start();
        }
    }, [visible, variant]);

    const getModalStyle = () => {
        const baseStyle = [styles.modalContent, styles[variant], styles[size]];
        
        if (variant === 'bottom') {
            return [
                ...baseStyle,
                { transform: [{ translateY: slideAnim }] },
                style,
            ];
        } else if (variant === 'center') {
            return [
                ...baseStyle,
                { transform: [{ scale: scaleAnim }] },
                style,
            ];
        }
        
        return [...baseStyle, style];
    };

    const handleBackdropPress = () => {
        if (closeOnBackdrop) {
            onClose();
        }
    };

    return (
        <RNModal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View 
                style={[
                    styles.backdrop, 
                    { opacity: fadeAnim },
                    backdropStyle
                ]}
            >
                <TouchableOpacity 
                    style={styles.backdropTouchable} 
                    onPress={handleBackdropPress}
                    activeOpacity={1}
                />
                
                <Animated.View style={getModalStyle()}>
                    {showCloseButton && variant !== 'fullscreen' && (
                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={24} color="#71717a" />
                        </TouchableOpacity>
                    )}
                    
                    {children}
                </Animated.View>
            </Animated.View>
        </RNModal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backdropTouchable: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f4f4f5', // zinc-100
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },

    // Variants
    center: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -200, // Adjust based on content
        marginLeft: -150, // Adjust based on content
        borderRadius: 16,
        maxHeight: '80%',
    },
    bottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    fullscreen: {
        flex: 1,
        margin: 0,
        borderRadius: 0,
    },

    // Sizes
    sm: {
        width: 300,
        padding: 16, // p-4
    },
    default: {
        width: 400,
        padding: 24, // p-6
    },
    lg: {
        width: 500,
        padding: 32, // p-8
    },
    xl: {
        width: 600,
        padding: 40, // p-10
    },
});

