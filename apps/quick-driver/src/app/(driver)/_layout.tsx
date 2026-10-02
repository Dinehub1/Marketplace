import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { BRAND } from '@/components/ui/primitives';

export default function DriverTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: BRAND }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Duty',
          tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
