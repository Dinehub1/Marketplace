import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './RootNavigator';
import { useAuth } from '../contexts/AuthContext';

export const AppNavigator: React.FC = () => {
  const { isLoggedIn } = useAuth();
  
  console.info('🧭 AppNavigator render - isLoggedIn:', isLoggedIn);

  return (
    <NavigationContainer key={`nav-${isLoggedIn ? 'authenticated' : 'guest'}`}>
      <RootNavigator />
    </NavigationContainer>
  );
};