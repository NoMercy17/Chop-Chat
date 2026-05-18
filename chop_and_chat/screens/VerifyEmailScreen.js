import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, fp } from '../utils/responsive';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

function maskEmail(email) {
  const atIndex = email.indexOf('@');
  if (atIndex < 2) return email;
  return email.slice(0, 2) + '***' + email.slice(atIndex);
}

export default function VerifyEmailScreen({ navigation, route }) {
  const { email, initialCooldown = 120 } = route.params;
  const { theme, isDarkMode } = useTheme();

  const [cooldown, setCooldown] = useState(initialCooldown);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(prev => Math.max(0, prev - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError('');
    setResendSuccess(false);
    try {
      await api.post('/resend-verification', { email });
      setResendSuccess(true);
      setCooldown(120);
    } catch (err) {
      setError(err.message || 'Could not send verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const minutes = Math.floor(cooldown / 60);
  const seconds = cooldown % 60;
  const countdownText = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const canResend = cooldown === 0 && !resendLoading;

  const gradientColors = isDarkMode
    ? ['#081729', '#1a3a52']
    : ['#1e3a8a', '#93C5FD'];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.headerSection}>
        <Text style={styles.appName}>Chop & Chat</Text>
        <Text style={styles.tagline}>Cook. Share. Get Roasted.</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
        <View style={[styles.cardAccent, { backgroundColor: theme.primary }]} />

        <Text style={[styles.title, { color: theme.textPrimary }]}>Check your inbox</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {'We sent a verification link to\n'}
          <Text style={[styles.emailHighlight, { color: theme.primary }]}>
            {maskEmail(email)}
          </Text>
        </Text>

        <Text style={[styles.instruction, { color: theme.textTertiary }]}>
          Tap the link in the email to verify your account, then come back here to sign in.
        </Text>

        {resendSuccess ? (
          <Text style={[styles.feedbackText, { color: theme.success }]}>
            A new verification link has been sent!
          </Text>
        ) : null}

        {error ? (
          <Text style={[styles.feedbackText, { color: theme.danger }]}>{error}</Text>
        ) : null}

        <Pressable
          onPress={handleResend}
          disabled={!canResend}
          style={({ pressed }) => [
            styles.resendBtn,
            {
              borderColor: canResend ? theme.primary : theme.border,
              backgroundColor: canResend && pressed ? theme.primaryLightest : 'transparent',
            },
          ]}
        >
          {resendLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text
              style={[
                styles.resendBtnText,
                { color: canResend ? theme.primary : theme.textTertiary },
              ]}
            >
              {cooldown > 0 ? `Resend in ${countdownText}` : 'Resend verification email'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Login')}
          style={({ pressed }) => [styles.loginLink, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.loginLinkText, { color: theme.textTertiary }]}>
            Already verified?{' '}
            <Text style={{ color: theme.primary, fontWeight: '700' }}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: {
    alignItems: 'center',
    paddingTop: hp(80),
    paddingBottom: hp(32),
  },
  appName: {
    fontSize: fp(30),
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: fp(13),
    marginTop: hp(6),
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.85)',
  },
  card: {
    flex: 1,
    borderTopLeftRadius: wp(32),
    borderTopRightRadius: wp(32),
    paddingHorizontal: wp(24),
    paddingTop: hp(28),
    elevation: 8,
    alignItems: 'center',
  },
  cardAccent: {
    width: wp(40),
    height: hp(4),
    borderRadius: hp(2),
    marginBottom: hp(24),
  },
  title: {
    fontSize: fp(24),
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fp(14),
    marginTop: hp(8),
    marginBottom: hp(16),
    textAlign: 'center',
    lineHeight: fp(22),
  },
  emailHighlight: { fontWeight: '700' },
  instruction: {
    fontSize: fp(13),
    textAlign: 'center',
    lineHeight: fp(20),
    marginBottom: hp(32),
    paddingHorizontal: wp(8),
  },
  feedbackText: {
    fontSize: fp(13),
    textAlign: 'center',
    marginBottom: hp(12),
  },
  resendBtn: {
    borderWidth: 1.5,
    borderRadius: wp(14),
    paddingVertical: hp(14),
    paddingHorizontal: wp(24),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(48),
    marginBottom: hp(16),
  },
  resendBtnText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  loginLink: {
    paddingVertical: hp(12),
  },
  loginLinkText: {
    fontSize: fp(14),
  },
});
