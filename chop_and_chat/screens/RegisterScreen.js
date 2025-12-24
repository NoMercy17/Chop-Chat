import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const BASE_URL = 'http://localhost:4000'; // change for emulator/device as noted above

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const onRegister = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Email and password are required');
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
    <LinearGradient
      colors={['#3B82F6', '#2563EB', '#1D4ED8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Register</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="Name (optional)"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

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
              styles.createButton,
              pressed && styles.buttonPressed
            ]}
            onPress={onRegister}
          >
            <Text style={styles.createButtonText}>Create account</Text>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.textButtonPressed
            ]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
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
  createButton: {
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
  createButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
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