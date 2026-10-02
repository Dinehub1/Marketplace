import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { BRAND } from '@/components/ui/primitives';

export default function AdminTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: BRAND }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Live ops',
          tabBarIcon: ({ color, size }) => <Ionicons name="pulse" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="drivers"
        options={{
          title: 'Drivers',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="promos"
        options={{
          title: 'Pricing',
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetag" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
