import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext, navigationRef } from '../App';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const BASE_URL = 'http://localhost:4000'; // change for emulator/device as noted above

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useContext(AuthContext);

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

      // navigate to main app (Home). use navigationRef so we reset the whole nav stack.
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
    <LinearGradient
      colors={['#3B82F6', '#2563EB', '#1D4ED8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Login</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <Pressable 
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.buttonPressed
            ]}
            onPress={onLogin}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              styles.createAccountButton,
              pressed && styles.textButtonPressed
            ]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.createAccountButtonText}>Create account</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  form: {
    gap: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    fontSize: 16,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  loginButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  createAccountButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    alignItems: 'center',
  },
  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  textButtonPressed: {
    opacity: 0.7,
  },
});