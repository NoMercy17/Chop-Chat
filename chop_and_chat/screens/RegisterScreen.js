import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { wp, hp, fp } from '../utils/responsive';
import { AuthContext } from '../context/AuthContext';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user'); // 'user' or 'chef'
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);

  const onRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Validation', 'Name, email and password are required');
      return;
    }

    setLoading(true);
    const result = await register({ email, password, name, role });
    setLoading(false);

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
      <View style={styles.headerSection}>
        <Text style={styles.appName}>Cook&Chat</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formSection}>
        <View style={styles.formCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>Join our culinary community</Text>

            <View style={styles.inputsWrapper}>
              <AppInput label="Full Name" placeholder="John Doe" value={name} onChangeText={setName} />
              <AppInput label="Email" placeholder="your@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <AppInput label="Password" placeholder="Minimum 6 characters" value={password} onChangeText={setPassword} secureTextEntry />
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>I am a...</Text>
                <View style={styles.roleContainer}>
                  <AppButton 
                    title="Food Enthusiast" 
                    variant={role === 'user' ? 'primary' : 'secondary'} 
                    onPress={() => setRole('user')}
                    style={styles.roleBtn}
                  />
                  <AppButton 
                    title="Professional Chef" 
                    variant={role === 'chef' ? 'primary' : 'secondary'} 
                    onPress={() => setRole('chef')}
                    style={styles.roleBtn}
                  />
                </View>
              </View>
            </View>

            <AppButton title="Sign Up" onPress={onRegister} loading={loading} />
            
            <AppButton title="Back to Login" variant="secondary" onPress={() => navigation.goBack()} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#93C5FD' },
  headerSection: { alignItems: 'center', paddingTop: hp(60), paddingBottom: hp(24) },
  appName: { fontSize: fp(32), fontWeight: '700', color: '#1E40AF' },
  formSection: { flex: 1 },
  formCard: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: wp(32), borderTopRightRadius: wp(32), paddingHorizontal: wp(24), paddingTop: hp(32), elevation: 8 },
  formTitle: { fontSize: fp(24), fontWeight: '700', color: '#111827' },
  formSubtitle: { fontSize: fp(14), color: '#6B7280', marginTop: hp(4), marginBottom: hp(24) },
  inputsWrapper: { marginBottom: hp(16) },
  inputLabel: { fontSize: fp(14), fontWeight: '600', color: '#374151', marginBottom: hp(8), marginLeft: wp(4) },
  roleContainer: { flexDirection: 'column', gap: hp(8) }
});
