import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Animated, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { wp, hp, fp } from '../utils/responsive';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

function maskEmail(email) {
  const atIndex = email.indexOf('@');
  if (atIndex < 2) return email;
  return email.slice(0, 2) + '***' + email.slice(atIndex);
}

export default function OTPScreen({ navigation, route }) {
  const { email } = route.params;
  const { confirmOtp } = useContext(AuthContext);
  const { theme } = useTheme();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const digitsRef = useRef(digits);

  useEffect(() => {
    digitsRef.current = digits;
  }, [digits]);

  useEffect(() => {
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  // Countdown tick — resets when cooldown is refreshed (on resend)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const shake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const submitCode = useCallback(async (code) => {
    setLoading(true);
    setError('');
    const result = await confirmOtp({ email, code });
    setLoading(false);

    if (!result.success) {
      shake();
      setDigits(['', '', '', '', '', '']);
      setError(result.error || 'Invalid code');
      setTimeout(() => inputRefs.current[0]?.focus(), 80);

      if (result.tooManyAttempts) {
        navigation.goBack();
      }
    }
    // Success: confirmOtp calls signIn → user state set → App.js switches to MainStack automatically
  }, [confirmOtp, email, navigation, shake]);

  const handleDigitChange = useCallback((text, index) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digitsRef.current];
    next[index] = digit;
    setDigits(next);
    setError('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5 && next.every(d => d !== '')) {
      submitCode(next.join(''));
    }
  }, [submitCode]);

  const handleKeyPress = useCallback((e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digitsRef.current[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, []);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      await api.post('/resend-otp', { email });
      setError('');
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Could not resend code');
    } finally {
      setResendLoading(false);
    }
  }, [email, resendCooldown, resendLoading]);

  const hasError = !!error;

  return (
    <View style={[styles.container, { backgroundColor: theme.screenBackground }]}>
      <StatusBar style="dark" />
      <View style={styles.headerSection}>
        <Text style={[styles.appName, { color: theme.primaryDark }]}>Chop & Chat</Text>
        <Text style={[styles.tagline, { color: theme.primaryDark }]}>Cook. Share. Get Roasted.</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formSection}
      >
        <View style={[styles.formCard, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.cardAccent, { backgroundColor: theme.primary }]} />
          <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Check your email</Text>
          <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
            {'We sent a 6-digit code to\n'}
            <Text style={[styles.emailHighlight, { color: theme.textMuted }]}>{maskEmail(email)}</Text>
          </Text>

          <Animated.View
            style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
          >
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={ref => { inputRefs.current[i] = ref; }}
                style={[
                  styles.otpBox,
                  {
                    borderColor: hasError ? theme.danger : digit ? theme.primaryDark : theme.border,
                    backgroundColor: hasError ? theme.dangerLighter : digit ? theme.primaryLightest : theme.inputBackground,
                    color: theme.textPrimary,
                  },
                ]}
                value={digit}
                onChangeText={text => handleDigitChange(text, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
                caretHidden
              />
            ))}
          </Animated.View>

          {hasError ? (
            <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          ) : null}

          {loading ? (
            <ActivityIndicator style={styles.loader} color={theme.primaryDark} />
          ) : null}

          <TouchableOpacity
            onPress={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            style={styles.resendBtn}
            activeOpacity={0.7}
          >
            <Text style={[styles.resendText, { color: theme.primaryDark }, resendCooldown > 0 && { color: theme.textTertiary }]}>
              {resendCooldown > 0
                ? `Resend in 0:${String(resendCooldown).padStart(2, '0')}`
                : resendLoading
                  ? 'Sending...'
                  : 'Resend code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Text style={[styles.backText, { color: theme.textSecondary }]}>← Back to sign up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { alignItems: 'center', paddingTop: hp(80), paddingBottom: hp(24) },
  appName: { fontSize: fp(30), fontWeight: '800', letterSpacing: -0.5 },
  tagline: { fontSize: fp(13), marginTop: hp(6), opacity: 0.75, letterSpacing: 0.4 },
  formSection: { flex: 1 },
  formCard: {
    flex: 1,
    borderTopLeftRadius: wp(32),
    borderTopRightRadius: wp(32),
    paddingHorizontal: wp(24),
    paddingTop: hp(20),
    elevation: 8,
  },
  cardAccent: { width: wp(40), height: hp(4), borderRadius: hp(2), alignSelf: 'center', marginBottom: hp(24) },
  formTitle: {
    fontSize: fp(24),
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: fp(14),
    marginTop: hp(8),
    marginBottom: hp(36),
    textAlign: 'center',
    lineHeight: fp(22),
  },
  emailHighlight: { fontWeight: '600' },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(12),
  },
  otpBox: {
    width: wp(44),
    height: wp(54),
    borderRadius: wp(10),
    borderWidth: 2,
    textAlign: 'center',
    fontSize: fp(22),
    fontWeight: '700',
  },
  otpBoxFilled: {},
  otpBoxError: {},
  errorText: {
    fontSize: fp(13),
    textAlign: 'center',
    marginBottom: hp(8),
  },
  loader: { marginVertical: hp(12) },
  resendBtn: { marginTop: hp(24), alignItems: 'center', paddingVertical: hp(8) },
  resendText: { fontSize: fp(14), fontWeight: '600' },
  backBtn: { marginTop: hp(12), alignItems: 'center', paddingVertical: hp(8) },
  backText: { fontSize: fp(14) },
});
