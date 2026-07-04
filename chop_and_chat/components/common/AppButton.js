import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { wp, hp, fp } from '../../utils/responsive';

export default function AppButton({ title, onPress, variant = 'primary', loading = false, disabled = false, theme }) {
  const isSecondary = variant === 'secondary';
  const bg = isSecondary ? 'transparent' : (theme?.primaryDark ?? '#2563EB');
  const borderCol = theme?.primaryDark ?? '#2563EB';
  const textCol = isSecondary ? (theme?.primaryDark ?? '#2563EB') : (theme?.textInverse ?? '#FFFFFF');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderWidth: isSecondary ? 1 : 0,
          borderColor: borderCol,
        },
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={textCol} />
      ) : (
        <Text style={[styles.text, { color: textCol }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { height: hp(56), borderRadius: wp(16), justifyContent: 'center', alignItems: 'center', marginVertical: hp(8), width: '100%' },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  buttonDisabled: { opacity: 0.6 },
  text: { fontSize: fp(16), fontWeight: '700' },
});
