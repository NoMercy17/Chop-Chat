import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, fp } from '../utils/responsive';
import { AuthContext } from '../context/AuthContext';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import { useTheme } from '../context/ThemeContext';
import ChefQuizModal from '../components/auth/ChefQuizModal';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizVisible, setQuizVisible] = useState(false);
  const { register } = useContext(AuthContext);
  const { theme, isDarkMode } = useTheme();
  const emailRef = useRef(null);
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
    if (!name.trim()) {
      setNameError('Full name is required');
      valid = false;
    }
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

  // Called only on explicit button press — no auto-submit under any condition.
  const onRegister = () => {
    if (!validate()) return;
    if (role === 'chef') {
      // Chef path: gate behind the knowledge quiz before touching the backend
      setQuizVisible(true);
    } else {
      doRegister();
    }
  };

  const doRegister = async () => {
    setLoading(true);
    const result = await register({ email, password, name, role });
    setLoading(false);
    if (result.success) {
      navigation.navigate('VerifyEmail', { email: email.toLowerCase(), initialCooldown: 120 });
    } else {
      setEmailError(result.error || 'Could not create account');
    }
  };

  // Invoked by ChefQuizModal once all 4 answers are correct
  const handleQuizPass = async () => {
    const result = await register({ email, password, name, role });
    if (result.success) {
      setQuizVisible(false);
      navigation.navigate('VerifyEmail', { email: email.toLowerCase(), initialCooldown: 120 });
    } else {
      setQuizVisible(false);
      setEmailError(result.error || 'Could not create account');
    }
  };

  const gradientColors = isDarkMode
    ? ['#081729', '#1a3a52']
    : ['#1e3a8a', '#93C5FD'];

  return (
    <>
    <LinearGradient colors={gradientColors} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.headerSection}>
        <Text style={styles.appName}>Chop & Chat</Text>
        <Text style={styles.tagline}>Cook. Share. Get Roasted.</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formSection}>
        <Animated.View style={[styles.formCard, { backgroundColor: theme.cardBackground, opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Join the kitchen</Text>
            <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>Tell us about yourself</Text>

            <View style={styles.inputsWrapper}>
              <AppInput
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChangeText={(t) => { setName(t); setNameError(''); }}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                error={nameError}
                theme={theme}
              />
              <AppInput
                ref={emailRef}
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
                error={passwordError}
                theme={theme}
              />

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>I am a...</Text>
                <View style={[styles.roleToggle, { backgroundColor: theme.borderLight }]}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.roleOption,
                      role === 'user' && { backgroundColor: theme.primary },
                      pressed && { transform: [{ scale: 0.96 }], opacity: 0.85 },
                    ]}
                    onPress={() => setRole('user')}
                  >
                    <Text style={[styles.roleOptionLabel, { color: role === 'user' ? theme.textInverse : theme.textSecondary }]}>
                      Food Lover
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.roleOption,
                      role === 'chef' && { backgroundColor: theme.primary },
                      pressed && { transform: [{ scale: 0.96 }], opacity: 0.85 },
                    ]}
                    onPress={() => setRole('chef')}
                  >
                    <Text style={[styles.roleOptionLabel, { color: role === 'chef' ? theme.textInverse : theme.textSecondary }]}>
                      Professional Chef
                    </Text>
                  </Pressable>
                </View>
                <Text style={[styles.roleHint, { color: theme.textTertiary }]}>
                  Food Lovers post and share. Chefs offer paid critiques.
                </Text>
              </View>
            </View>

            <AppButton title="Sign Up" onPress={onRegister} loading={loading} theme={theme} />

            <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.6 }]}>
              <Text style={[styles.backLinkMuted, { color: theme.textTertiary }]}>
                Already have an account?{' '}
                <Text style={[styles.backLinkAction, { color: theme.primary }]}>Sign in</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>

    <ChefQuizModal
      visible={quizVisible}
      onPass={handleQuizPass}
      onClose={() => setQuizVisible(false)}
      theme={theme}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  scrollContent: { paddingBottom: hp(40) },
  formTitle: { fontSize: fp(24), fontWeight: '700', letterSpacing: -0.5 },
  formSubtitle: { fontSize: fp(14), marginTop: hp(4), marginBottom: hp(24) },
  inputsWrapper: { marginBottom: hp(16) },
  inputGroup: { marginTop: hp(4) },
  inputLabel: { fontSize: fp(14), fontWeight: '600', marginBottom: hp(8), marginLeft: wp(4) },
  roleToggle: { flexDirection: 'row', borderRadius: wp(14), padding: wp(4), gap: wp(4) },
  roleOption: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: hp(14), borderRadius: wp(10) },
  roleOptionLabel: { fontSize: fp(14), fontWeight: '700' },
  roleHint: { fontSize: fp(12), marginTop: hp(8), marginLeft: wp(4) },
  backLink: { alignItems: 'center', paddingVertical: hp(16) },
  backLinkMuted: { fontSize: fp(14) },
  backLinkAction: { fontWeight: '700' },
});
