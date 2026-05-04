import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext, navigationRef } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { wp, hp, fp } from '../utils/responsive';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Email and password are required');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      try {
        if (navigationRef?.current?.resetRoot) {
          navigationRef.current.resetRoot({ index: 0, routes: [{ name: 'Home' }] });
        }
      } catch (e) { /* Handled by App.js context state */ }
    } else {
      Alert.alert('Login failed', result.error || 'Invalid credentials');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.headerSection}>
        <Text style={styles.appName}>Cook&Chat</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formSection}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome back</Text>
          <Text style={styles.formSubtitle}>Sign in to continue</Text>

          <View style={styles.inputsWrapper}>
            <AppInput label="Email" placeholder="your@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <AppInput label="Password" placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <AppButton title="Sign In" onPress={onLogin} loading={loading} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} /><Text style={styles.dividerText}>or</Text><View style={styles.dividerLine} />
          </View>

          <AppButton title="Create new account" variant="secondary" onPress={() => navigation.navigate('Register')} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#93C5FD' },
  headerSection: { alignItems: 'center', paddingTop: hp(80), paddingBottom: hp(32) },
  appName: { fontSize: fp(32), fontWeight: '700', color: '#1E40AF', letterSpacing: -0.5 },
  formSection: { flex: 1 },
  formCard: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: wp(32), borderTopRightRadius: wp(32), paddingHorizontal: wp(24), paddingTop: hp(32), elevation: 8 },
  formTitle: { fontSize: fp(24), fontWeight: '700', color: '#111827', letterSpacing: -0.5 },
  formSubtitle: { fontSize: fp(14), color: '#6B7280', marginTop: hp(4), marginBottom: hp(24) },
  inputsWrapper: { marginBottom: hp(8) },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: hp(20) },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: wp(12), color: '#9CA3AF', fontSize: fp(14) }
});
