import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import MyRecipes from './screens/MyRecipes';
import FavoriteRecipes from './screens/FavoriteRecipes';
import AuthStack from './context/AuthStack';
import { AuthContext, navigationRef } from './context/AuthContext';

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
            <MainStack.Screen name="MyRecipes" component={MyRecipes} options={{ title: 'My Recipes' }} />
            <MainStack.Screen name="FavoriteRecipes" component={FavoriteRecipes} options={{ title: 'Favorites' }} />
          </MainStack.Navigator>
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}