import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { wp, hp, fp } from '../utils/responsive';

const BASE_URL = 'http://192.168.0.107:4000';

//const BASE_URL_ANDROID = 'http://10.0.2.2:4000';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const onRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Validation', 'Name, email and password are required');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (res.status === 201) {
        Alert.alert('Success', 'Account created. Please login.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        const body = await res.json().catch(() => ({}));
        const msg = body.error || 'Registration failed';
        Alert.alert('Error', msg);
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
        <ScrollView 
          style={styles.formCard}
          contentContainerStyle={styles.formCardContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.formTitle}>Create account</Text>
          <Text style={styles.formSubtitle}>Fill in your details to get started</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              placeholder="Enter a username"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

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
              placeholder="Create a password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.registerButton,
              pressed && styles.buttonPressed
            ]}
            onPress={onRegister}
          >
            <Text style={styles.registerButtonText}>Create Account</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>already have an account?</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.secondaryButtonPressed
            ]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backButtonText}>Sign In</Text>
          </Pressable>
        </ScrollView>
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
    paddingTop: hp(60),
    paddingBottom: hp(24),
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp(-4) },
    shadowOpacity: 0.08,
    shadowRadius: wp(16),
    elevation: 8,
  },
  formCardContent: {
    paddingHorizontal: wp(24),
    paddingTop: hp(28),
    paddingBottom: hp(40),
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
  registerButton: {
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
  registerButtonText: {
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
    paddingHorizontal: wp(12),
    fontSize: fp(12),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: hp(16),
    borderRadius: wp(12),
    alignItems: 'center',
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: fp(16),
    fontWeight: '600',
  },
  secondaryButtonPressed: {
    opacity: 0.8,
    backgroundColor: '#E5E7EB',
  },
});
