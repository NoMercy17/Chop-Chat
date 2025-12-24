import React, { useEffect, useState, createContext, createRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthStack from './screens/AuthStack';

export const AuthContext = createContext();
export const navigationRef = createRef(); // export ref for programmatic navigation
const MainStack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('session_user');
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {
        console.warn('failed to restore session', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const auth = {
    user,
    signIn: async (userData) => {
      await AsyncStorage.setItem('session_user', JSON.stringify(userData));
      setUser(userData);
    },
    signOut: async () => {
      await AsyncStorage.removeItem('session_user');
      setUser(null);
    },
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={auth}>
      <NavigationContainer ref={navigationRef}>
        {user ? (
          <MainStack.Navigator>
            <MainStack.Screen name="Home" component={HomeScreen} />
            <MainStack.Screen name="Profile" component={ProfileScreen} />
          </MainStack.Navigator>
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}