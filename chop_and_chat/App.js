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
import { PostsProvider } from './context/PostsContext';
import { ChefFeedProvider } from './context/ChefFeedContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationsProvider } from './context/NotificationsContext';


const MainStack = createNativeStackNavigator();

// Separate component to use theme hook inside ThemeProvider
function AppContent() {
  const { theme, isLoading: themeLoading } = useTheme();
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

  if (loading || themeLoading) return null;

  return (
    <AuthContext.Provider value={auth}>
      <NotificationsProvider>
        <PostsProvider>
          <ChefFeedProvider>
            <NavigationContainer ref={navigationRef}>
              {user ? (
              <MainStack.Navigator
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: theme.background },
                }}
              >
                <MainStack.Screen name="Home" component={HomeScreen} />
                <MainStack.Screen name="Profile" component={ProfileScreen} />
                <MainStack.Screen name="MyRecipes" component={MyRecipes} />
                <MainStack.Screen name="FavoriteRecipes" component={FavoriteRecipes} />
                <MainStack.Screen name="AllChefReviews" component={AllChefReviews} />
                <MainStack.Screen name="AllCommunityPosts" component={AllCommunityPosts} />
              </MainStack.Navigator>
              ) : (
                <AuthStack />
              )}
            </NavigationContainer>
          </ChefFeedProvider>
        </PostsProvider>
      </NotificationsProvider>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}