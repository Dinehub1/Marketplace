import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './MainNavigator';
import { SplashScreen } from '../screens/SplashScreen';

const Stack = createStackNavigator();

export const RootNavigator: React.FC = () => {
  const { isLoggedIn, isLoading, user } = useAuth();

  console.info('📱 RootNavigator render:', { 
    isLoggedIn, 
    isLoading, 
    userEmail: user?.email || null,
    timestamp: new Date().toISOString()
  });

  if (isLoading) {
    console.info('⏳ Showing splash screen...');
    return <SplashScreen />;
  }

  const authKey = `auth-${isLoggedIn ? 'in' : 'out'}-${Date.now()}`;
  console.info('🔄 Navigation key:', authKey, '- Stack:', isLoggedIn ? 'App' : 'Auth');

  return (
    <Stack.Navigator 
      key={authKey}
      screenOptions={{ 
        headerShown: false,
        animationEnabled: true,
      }}
    >
      {isLoggedIn ? (
        <Stack.Screen 
          name="App" 
          component={AppNavigator}
          options={{
            gestureEnabled: false, // Prevent swipe back to auth
          }}
        />
      ) : (
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{
            gestureEnabled: false,
          }}
        />
      )}
    </Stack.Navigator>
  );
};
