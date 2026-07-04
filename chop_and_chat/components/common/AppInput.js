import React, { forwardRef, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';
import { wp, hp, fp } from '../../utils/responsive';

const AppInput = forwardRef(function AppInput(
  { label, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize = 'none', error, theme, ...rest },
  ref
) {
  const errorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      Animated.timing(errorAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else {
      errorAnim.setValue(0);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme?.textMuted ?? '#374151' }]}>{label}</Text>
      )}
      <View style={[
        styles.inputWrapper,
        {
          backgroundColor: theme?.inputBackground ?? '#F9FAFB',
          borderColor: error ? (theme?.danger ?? '#EF4444') : (theme?.inputBorder ?? '#E5E7EB'),
        },
      ]}>
        <TextInput
          ref={ref}
          style={[styles.input, { color: theme?.textPrimary ?? '#111827' }]}
          placeholder={placeholder}
          placeholderTextColor={theme?.placeholderText ?? '#9CA3AF'}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          {...rest}
        />
      </View>
      {error && (
        <Animated.Text style={[
          styles.errorText,
          { color: theme?.danger ?? '#EF4444' },
          {
            opacity: errorAnim,
            transform: [{ translateY: errorAnim.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) }],
          },
        ]}>{error}</Animated.Text>
      )}
    </View>
  );
});

export default AppInput;

const styles = StyleSheet.create({
  container: { marginBottom: hp(16), width: '100%' },
  label: { fontSize: fp(14), fontWeight: '600', marginBottom: hp(6), marginLeft: wp(4) },
  inputWrapper: { height: hp(52), borderRadius: wp(12), borderWidth: 1, paddingHorizontal: wp(16), justifyContent: 'center' },
  input: { fontSize: fp(16) },
  errorText: { fontSize: fp(12), marginTop: hp(4), marginLeft: wp(4) },
});
