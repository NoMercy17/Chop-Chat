import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import MyRecipes from './screens/MyRecipes';
import FavoriteRecipes from './screens/FavoriteRecipes';
import AllChefReviews from './screens/AllChefReviews';
import AllCommunityPosts from './screens/AllCommunityPosts';
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
    <SafeAreaProvider>
      <AuthContext.Provider value={auth}>
        <NavigationContainer ref={navigationRef}>
          {user ? (
            <MainStack.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: '#F3F4F6' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: '#F3F4F6' },
              }}
            >
              <MainStack.Screen name="Home" component={HomeScreen} />
              <MainStack.Screen name="Profile" component={ProfileScreen} />
              <MainStack.Screen name="MyRecipes" component={MyRecipes} options={{ title: 'My Recipes' }} />
              <MainStack.Screen name="FavoriteRecipes" component={FavoriteRecipes} options={{ title: 'Favorites' }} />
              <MainStack.Screen name="AllChefReviews" component={AllChefReviews} options={{ title: 'Chef Reviews' }} />
              <MainStack.Screen name="AllCommunityPosts" component={AllCommunityPosts} options={{ title: 'Community' }} />
            </MainStack.Navigator>
          ) : (
            <AuthStack />
          )}
        </NavigationContainer>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}