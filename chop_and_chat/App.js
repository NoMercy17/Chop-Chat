import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Modal, Animated, Easing, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp, hp, fp } from './utils/responsive';
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
import NotificationToast from './components/home/notifications/NotificationToast';


const MainStack = createNativeStackNavigator();

// Separate component to use theme and auth hooks inside Providers
function AppContent() {
  const { theme, isLoading: themeLoading } = useTheme();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (!user?.isChef || !user?.id) return;
    AsyncStorage.getItem(`chef_welcome_seen_${user.id}`).then(seen => {
      if (!seen) {
        setWelcomeVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 260, easing: Easing.bezier(0.23, 1, 0.32, 1), useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 260, easing: Easing.bezier(0.23, 1, 0.32, 1), useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 260, easing: Easing.bezier(0.23, 1, 0.32, 1), useNativeDriver: true }),
        ]).start();
      }
    });
  }, [user?.id, user?.isChef]);

  const dismissWelcome = useCallback(async () => {
    if (!user?.id) return;
    await AsyncStorage.setItem(`chef_welcome_seen_${user.id}`, '1');
    setWelcomeVisible(false);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    slideAnim.setValue(16);
  }, [user?.id, fadeAnim, scaleAnim, slideAnim]);

  if (authLoading || themeLoading) return null;

  return (
    <NotificationsProvider>
      <FollowProvider>
        <PostsProvider>
          <ChefFeedProvider>
            <View style={{ flex: 1 }}>
              <Modal
                visible={welcomeVisible}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={dismissWelcome}
              >
                <View style={[welcomeStyles.overlay, { backgroundColor: theme.overlayBackgroundDark }]}>
                  <Animated.View
                    style={[
                      welcomeStyles.card,
                      { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor },
                      {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
                      },
                    ]}
                  >
                    <Text style={[welcomeStyles.title, { color: theme.textPrimary }]}>
                      Welcome to Chop & Chat, Chef
                    </Text>
                    <Text style={[welcomeStyles.body, { color: theme.textSecondary }]}>
                      For every review you complete, you earn $0.10.
                    </Text>
                    <Pressable
                      style={({ pressed }) => [
                        welcomeStyles.button,
                        { backgroundColor: pressed ? theme.primary : theme.primaryDark },
                        pressed && welcomeStyles.buttonPressed,
                      ]}
                      onPress={dismissWelcome}
                    >
                      <Text style={[welcomeStyles.buttonText, { color: theme.textInverse }]}>Got it</Text>
                    </Pressable>
                  </Animated.View>
                </View>
              </Modal>
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
              <NotificationToast />
            </View>
          </ChefFeedProvider>
        </PostsProvider>
      </FollowProvider>
    </NotificationsProvider>
  );
}

const welcomeStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(28),
  },
  card: {
    width: '100%',
    borderRadius: wp(20),
    padding: wp(28),
    paddingBottom: wp(24),
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  title: {
    fontSize: fp(22),
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: hp(12),
  },
  body: {
    fontSize: fp(15),
    lineHeight: fp(15) * 1.55,
    marginBottom: hp(24),
  },
  button: {
    borderRadius: wp(14),
    paddingVertical: hp(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    fontSize: fp(16),
    fontWeight: '700',
  },
});

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
