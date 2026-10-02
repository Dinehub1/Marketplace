import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Fonts, Spacing } from '../constants';
import { Button } from '../components/common/Button';

export const DebugScreen: React.FC = () => {
  const { user, isLoggedIn, isLoading, login, logout } = useAuth();

  const handleTestLogin = async () => {
    try {
      await login('test@example.com', 'password123');
    } catch (error) {
      console.log('Debug login error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Debug Auth State</Text>
        
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>isLoggedIn: {String(isLoggedIn)}</Text>
          <Text style={styles.debugText}>isLoading: {String(isLoading)}</Text>
          <Text style={styles.debugText}>user: {user ? JSON.stringify(user, null, 2) : 'null'}</Text>
        </View>

        <Button
          title="Test Login"
          onPress={handleTestLogin}
          style={styles.button}
        />

        <Button
          title="Test Logout"
          onPress={logout}
          variant="outline"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.screenPadding,
  },
  title: {
    fontSize: Fonts.size['2xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  debugInfo: {
    backgroundColor: Colors.gray100,
    padding: Spacing.lg,
    borderRadius: Spacing.borderRadius.md,
    marginBottom: Spacing.xl,
  },
  debugText: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'monospace',
  },
  button: {
    marginBottom: Spacing.md,
  },
});
