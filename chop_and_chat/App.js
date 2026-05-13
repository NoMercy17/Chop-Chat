import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import OtherUserProfileScreen from './screens/OtherUserProfileScreen';
import MyRecipes from './screens/MyRecipes';
import FavoriteRecipes from './screens/FavoriteRecipes';
import AllChefReviews from './screens/AllChefReviews';
import AllCommunityPosts from './screens/AllCommunityPosts';
import AuthStack from './context/AuthStack';
import { AuthContext, AuthProvider, navigationRef } from './context/AuthContext';
import { PostsProvider } from './context/PostsContext';
import { ChefFeedProvider } from './context/ChefFeedContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { FollowProvider } from './context/FollowContext';


const MainStack = createNativeStackNavigator();

// Separate component to use theme and auth hooks inside Providers
function AppContent() {
  const { theme, isLoading: themeLoading } = useTheme();
  const { user, loading: authLoading } = useContext(AuthContext);

  if (authLoading || themeLoading) return null;

  return (
    <NotificationsProvider>
      <FollowProvider>
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
                <MainStack.Screen name="OtherUserProfile" component={OtherUserProfileScreen} />
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
      </FollowProvider>
    </NotificationsProvider>
  );
}

export default function App() {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
      merchantIdentifier="merchant.com.anonymous.chop_and_chat"
    >
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </StripeProvider>
  );
}
