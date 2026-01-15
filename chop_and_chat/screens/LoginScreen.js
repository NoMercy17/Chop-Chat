import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext, navigationRef } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { wp, hp, fp } from '../utils/responsive';

// Use your computer's IP for physical devices
const BASE_URL = 'http://192.168.0.107:4000';

//const BASE_URL_ANDROID = 'http://10.0.2.2:4000';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useContext(AuthContext);
  const { isDarkMode, theme } = useTheme();

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Email and password are required');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert('Login failed', body.error || 'Invalid credentials');
        return;
      }

      const { token, user } = body;
      if (!token || !user) {
        Alert.alert('Login failed', 'Server response missing token/user');
        return;
      }

      const session = { token, user };
      await AsyncStorage.setItem('session_user', JSON.stringify(session));
      await auth.signIn(session);

      try {
        if (navigationRef && navigationRef.current && navigationRef.current.resetRoot) {
          navigationRef.current.resetRoot({ index: 0, routes: [{ name: 'Home' }] });
          return;
        }
      } catch (e) {
        // fallback: nothing — App gating will show Home
      }
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Could not reach server');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.appName}>Cook&Chat</Text>
      </View>

      {/* Form Card */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formSection}
      >
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome back</Text>
          <Text style={styles.formSubtitle}>Sign in to continue</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              placeholder="your@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.buttonPressed
            ]}
            onPress={onLogin}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.createAccountButton,
              pressed && styles.secondaryButtonPressed
            ]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.createAccountButtonText}>Create new account</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#93C5FD',
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: hp(80),
    paddingBottom: hp(32),
  },
  appName: {
    fontSize: fp(32),
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: -0.5,
  },
  formSection: {
    flex: 1,
  },
  formCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp(32),
    borderTopRightRadius: wp(32),
    paddingHorizontal: wp(24),
    paddingTop: hp(32),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp(-4) },
    shadowOpacity: 0.08,
    shadowRadius: wp(16),
    elevation: 8,
  },
  formTitle: {
    fontSize: fp(24),
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: fp(14),
    color: '#6B7280',
    marginTop: hp(4),
    marginBottom: hp(24),
  },
  inputGroup: {
    marginBottom: hp(16),
  },
  inputLabel: {
    fontSize: fp(13),
    fontWeight: '600',
    color: '#374151',
    marginBottom: hp(8),
  },
  input: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
    borderRadius: wp(12),
    fontSize: fp(16),
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: hp(16),
    borderRadius: wp(12),
    alignItems: 'center',
    marginTop: hp(8),
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: hp(4) },
    shadowOpacity: 0.3,
    shadowRadius: wp(8),
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: fp(16),
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp(24),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: wp(16),
    fontSize: fp(13),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  createAccountButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: hp(16),
    borderRadius: wp(12),
    alignItems: 'center',
  },
  createAccountButtonText: {
    color: '#3B82F6',
    fontSize: fp(16),
    fontWeight: '600',
  },
  secondaryButtonPressed: {
    opacity: 0.8,
    backgroundColor: '#E5E7EB',
  },
});
