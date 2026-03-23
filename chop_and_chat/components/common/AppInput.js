import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { wp, hp, fp } from '../../utils/responsive';

export default function AppInput({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize = 'none', error }) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: hp(16), width: '100%' },
  label: { fontSize: fp(14), fontWeight: '600', color: '#374151', marginBottom: hp(6), marginLeft: wp(4) },
  inputWrapper: { height: hp(52), backgroundColor: '#F9FAFB', borderRadius: wp(12), borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: wp(16), justifyContent: 'center' },
  input: { fontSize: fp(16), color: '#111827' },
  inputError: { borderColor: '#EF4444' },
  errorText: { fontSize: fp(12), color: '#EF4444', marginTop: hp(4), marginLeft: wp(4) }
});
