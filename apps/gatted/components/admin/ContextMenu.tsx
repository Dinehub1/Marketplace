import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity
} from 'react-native';

type MenuOption = {
    label: string;
    icon: string;
    onPress: () => void;
    editModeOnly?: boolean;
    destructive?: boolean;
};

type Props = {
    options: MenuOption[];
    isEditMode: boolean;
};

export default function ContextMenu({ options, isEditMode }: Props) {
    const [visible, setVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const showMenu = () => {
        setVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
        }).start();
    };

    const hideMenu = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
        }).start(() => setVisible(false));
    };

    const handleOptionPress = (option: MenuOption) => {
        hideMenu();
        setTimeout(() => option.onPress(), 150);
    };

    const filteredOptions = options.filter(
        opt => !opt.editModeOnly || isEditMode
    );

    return (
        <>
            <TouchableOpacity
                style={styles.menuButton}
                onPress={showMenu}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
            </TouchableOpacity>

            <Modal
                transparent
                visible={visible}
                animationType="none"
                onRequestClose={hideMenu}
            >
                <Pressable style={styles.overlay} onPress={hideMenu}>
                    <Animated.View
                        style={[
                            styles.menuContainer,
                            { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }
                        ]}
                    >
                        {filteredOptions.map((option, index) => (
                            <TouchableOpacity
                                key={option.label}
                                style={[
                                    styles.menuItem,
                                    index < filteredOptions.length - 1 && styles.menuItemBorder,
                                ]}
                                onPress={() => handleOptionPress(option)}
                            >
                                <Ionicons
                                    name={option.icon as any}
                                    size={18}
                                    color={option.destructive ? '#ef4444' : '#475569'}
                                />
                                <Text style={[
                                    styles.menuItemText,
                                    option.destructive && styles.destructiveText
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    menuButton: {
        padding: 8,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        minWidth: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    menuItemText: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
    destructiveText: {
        color: '#ef4444',
    },
});
