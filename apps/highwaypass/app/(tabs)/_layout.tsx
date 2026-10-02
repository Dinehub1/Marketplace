import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D1321',
          borderTopColor: 'rgba(100,116,139,0.15)',
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🎫" label="Buy Pass" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mypass"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🛡️" label="My Pass" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', gap: 2 },
  tabIcon: { fontSize: 22 },
  tabIconActive: { fontSize: 24 },
  tabLabel: { fontSize: 11, color: colors.gray500, fontWeight: '500' },
  tabLabelActive: { color: colors.green, fontWeight: '700' },
});
