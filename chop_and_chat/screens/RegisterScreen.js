import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { wp, hp, fp } from '../utils/responsive';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user'); // 'user' or 'chef'
  const { register } = useContext(AuthContext);

  const onRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Validation', 'Name, email and password are required');
      return;
    }

    const result = await register({ email, password, name, role });

    if (result.success) {
      Alert.alert('Success', 'Account created. Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } else {
      Alert.alert('Registration failed', result.error || 'Could not create account');
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
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>Join our culinary community</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                placeholder="John Doe"
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
                placeholder="Minimum 6 characters"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>I am a...</Text>
              <View style={styles.roleContainer}>
                <Pressable 
                  style={[styles.roleButton, role === 'user' && styles.roleButtonActive]}
                  onPress={() => setRole('user')}
                >
                  <Text style={[styles.roleButtonText, role === 'user' && styles.roleButtonTextActive]}>Home Cook</Text>
                </Pressable>
                <Pressable 
                  style={[styles.roleButton, role === 'chef' && styles.roleButtonActive]}
                  onPress={() => setRole('chef')}
                >
                  <Text style={[styles.roleButtonText, role === 'chef' && styles.roleButtonTextActive]}>Professional Chef</Text>
                </Pressable>
              </View>
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

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </Pressable>
            </View>
          </ScrollView>
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
  roleContainer: {
    flexDirection: 'row',
    gap: wp(12),
  },
  roleButton: {
    flex: 1,
    paddingVertical: hp(12),
    borderRadius: wp(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  roleButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  roleButtonText: {
    fontSize: fp(14),
    color: '#6B7280',
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: hp(16),
    borderRadius: wp(12),
    alignItems: 'center',
    marginTop: hp(16),
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: hp(24),
    marginBottom: hp(32),
  },
  footerText: {
    fontSize: fp(14),
    color: '#6B7280',
  },
  loginLink: {
    fontSize: fp(14),
    color: '#3B82F6',
    fontWeight: '600',
  },
});
