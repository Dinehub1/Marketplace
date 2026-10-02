import React, { useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

interface TabItem {
    value: string;
    label: string;
    content?: React.ReactNode;
}

interface TabsProps {
    tabs: TabItem[];
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    variant?: 'default' | 'pills' | 'underline';
    size?: 'sm' | 'default' | 'lg';
    style?: ViewStyle;
    tabStyle?: ViewStyle;
    contentStyle?: ViewStyle;
}

export const Tabs: React.FC<TabsProps> = ({
    tabs,
    defaultValue,
    onValueChange,
    variant = 'default',
    size = 'default',
    style,
    tabStyle,
    contentStyle,
}) => {
    const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const handleTabPress = (value: string) => {
        if (value === activeTab) return;

        // Fade out current content
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            setActiveTab(value);
            onValueChange?.(value);
            
            // Fade in new content
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }).start();
        });
    };

    const getTabButtonStyle = (isActive: boolean) => [
        styles.tabButton,
        styles[`${variant}TabButton`],
        styles[`${size}TabButton`],
        isActive && styles[`${variant}ActiveTabButton`],
        tabStyle,
    ];

    const getTabTextStyle = (isActive: boolean) => [
        styles.tabText,
        styles[`${size}TabText`],
        isActive && styles[`${variant}ActiveTabText`],
    ];

    const activeTabContent = tabs.find(tab => tab.value === activeTab)?.content;

    return (
        <View style={[styles.container, style]}>
            {/* Tab List */}
            <View style={[styles.tabList, styles[`${variant}TabList`]]}>
                {tabs.map((tab) => {
                    const isActive = tab.value === activeTab;
                    return (
                        <TouchableOpacity
                            key={tab.value}
                            style={getTabButtonStyle(isActive)}
                            onPress={() => handleTabPress(tab.value)}
                        >
                            <Text style={getTabTextStyle(isActive)}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Tab Content */}
            {activeTabContent && (
                <Animated.View 
                    style={[
                        styles.tabContent, 
                        contentStyle,
                        { opacity: fadeAnim }
                    ]}
                >
                    {activeTabContent}
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    tabList: {
        flexDirection: 'row',
    },
    tabContent: {
        paddingTop: 16, // pt-4
    },

    // Tab button base
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },

    // Tab text base
    tabText: {
        fontWeight: '500',
        textAlign: 'center',
    },

    // Default variant
    defaultTabList: {
        backgroundColor: '#f4f4f5', // zinc-100
        borderRadius: 12,
        padding: 4, // p-1
        gap: 4,
    },
    defaultTabButton: {
        backgroundColor: 'transparent',
        borderRadius: 8,
        paddingHorizontal: 16, // px-4
        paddingVertical: 8, // py-2
        minHeight: 40,
    },
    defaultActiveTabButton: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    defaultActiveTabText: {
        color: '#18181b', // slate-900
    },

    // Pills variant
    pillsTabList: {
        gap: 8, // gap-2
    },
    pillsTabButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#d4d4d8', // zinc-300
        borderRadius: 20, // rounded-full
    },
    pillsActiveTabButton: {
        backgroundColor: '#18181b', // slate-900
        borderColor: '#18181b',
    },
    pillsActiveTabText: {
        color: '#ffffff',
    },

    // Underline variant
    underlineTabList: {
        borderBottomWidth: 1,
        borderBottomColor: '#d4d4d8', // zinc-300
        gap: 0,
    },
    underlineTabButton: {
        backgroundColor: 'transparent',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        borderRadius: 0,
    },
    underlineActiveTabButton: {
        borderBottomColor: '#18181b', // slate-900
    },
    underlineActiveTabText: {
        color: '#18181b', // slate-900
    },

    // Sizes
    smTabButton: {
        paddingHorizontal: 12, // px-3
        paddingVertical: 6, // py-1.5
        minHeight: 32,
    },

    lgTabButton: {
        paddingHorizontal: 20, // px-5
        paddingVertical: 12, // py-3
        minHeight: 48,
    },

    // Text sizes
    smTabText: {
        fontSize: 12, // text-xs
    },
    defaultTabText: {
        fontSize: 14, // text-sm
        color: '#71717a', // zinc-500
    },
    lgTabText: {
        fontSize: 16, // text-base
    },
});

