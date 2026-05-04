import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { wp, hp, fp } from '../../utils/responsive';

export default function AppButton({ title, onPress, variant = 'primary', loading = false, disabled = false }) {
  const isSecondary = variant === 'secondary';

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.button,
        isSecondary ? styles.secondaryButton : styles.primaryButton,
        (pressed || disabled || loading) && styles.buttonPressed
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? '#1E40AF' : '#FFFFFF'} />
      ) : (
        <Text style={[
          styles.text,
          isSecondary ? styles.secondaryText : styles.primaryText
        ]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { height: hp(56), borderRadius: wp(16), justifyContent: 'center', alignItems: 'center', marginVertical: hp(8), width: '100%' },
  primaryButton: { backgroundColor: '#2563EB' },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#2563EB' },
  buttonPressed: { opacity: 0.7 },
  text: { fontSize: fp(16), fontWeight: '700' },
  primaryText: { color: '#FFFFFF' },
  secondaryText: { color: '#2563EB' }
});
