import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Alert, Animated, Easing, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { AuthContext, navigationRef } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, fp } from '../utils/responsive';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { theme, isDarkMode } = useTheme();
  const passwordRef = useRef(null);
  const cardSlide = useRef(new Animated.Value(50)).current;
  const cardFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 380,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validate = () => {
    let valid = true;
    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address');
      valid = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    }
    return valid;
  };

  const onLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      try {
        if (navigationRef?.current?.resetRoot) {
          navigationRef.current.resetRoot({ index: 0, routes: [{ name: 'Home' }] });
        }
      } catch (e) { /* Handled by App.js context state */ }
    } else if (result.error === 'EMAIL_NOT_VERIFIED') {
      navigation.navigate('VerifyEmail', { email: result.email, initialCooldown: 0 });
    } else {
      setPasswordError(result.error || 'Incorrect email or password');
    }
  };

  const gradientColors = isDarkMode
    ? ['#081729', '#1a3a52']
    : ['#1e3a8a', '#93C5FD'];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.flex}>
          <StatusBar style="light" />
          <View style={styles.headerSection}>
            <Text style={styles.appName}>Chop & Chat</Text>
            <Text style={styles.tagline}>Cook. Share. Get Roasted.</Text>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formSection}>
            <Animated.View style={[styles.formCard, { backgroundColor: theme.cardBackground, opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
              <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Good to see you</Text>
              <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>Sign in to keep cooking</Text>

              <View style={styles.inputsWrapper}>
                <AppInput
                  label="Email"
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  error={emailError}
                  theme={theme}
                />
                <AppInput
                  ref={passwordRef}
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={onLogin}
                  error={passwordError}
                  theme={theme}
                />
                <Pressable
                  onPress={() => Alert.alert('Coming soon', 'Password reset will be available in an upcoming update.')}
                  style={({ pressed }) => [styles.forgotPassword, pressed && { opacity: 0.6 }]}
                >
                  <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>Forgot password?</Text>
                </Pressable>
              </View>

              <AppButton title="Sign In" onPress={onLogin} loading={loading} theme={theme} />

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.textTertiary }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              <AppButton title="Create new account" variant="secondary" onPress={() => navigation.navigate('Register')} theme={theme} />
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerSection: { alignItems: 'center', paddingTop: hp(80), paddingBottom: hp(32) },
  appName: { fontSize: fp(30), fontWeight: '800', letterSpacing: -0.5, color: '#FFFFFF' },
  tagline: { fontSize: fp(13), marginTop: hp(6), letterSpacing: 0.4, color: 'rgba(255,255,255,0.85)' },
  formSection: { flex: 1 },
  formCard: {
    flex: 1,
    borderTopLeftRadius: wp(32),
    borderTopRightRadius: wp(32),
    paddingHorizontal: wp(24),
    paddingTop: hp(28),
    elevation: 8,
  },
  formTitle: { fontSize: fp(24), fontWeight: '700', letterSpacing: -0.5 },
  formSubtitle: { fontSize: fp(14), marginTop: hp(4), marginBottom: hp(24) },
  inputsWrapper: { marginBottom: hp(8) },
  forgotPassword: { alignSelf: 'flex-end', marginTop: hp(-4), marginBottom: hp(12) },
  forgotPasswordText: { fontSize: fp(13), fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: hp(20) },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: wp(12), fontSize: fp(14) },
});
