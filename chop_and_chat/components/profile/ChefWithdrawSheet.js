import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { wp, hp, fp } from '../../utils/responsive';
import BottomSheetModal from '../common/BottomSheetModal';

export default function ChefWithdrawSheet({ visible, balance, onClose, onWithdraw, theme }) {
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState('input'); // 'input' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.92)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const numericAmount = parseFloat(amount) || 0;
  const canConfirm = numericAmount >= 1.00 && numericAmount <= (balance || 0) && !loading;

  const handleFillAll = useCallback(() => {
    setAmount((balance || 0).toFixed(2));
    setStage('input');
  }, [balance]);

  const handleAmountChange = useCallback((text) => {
    setAmount(text.replace(/[^0-9.]/g, ''));
    if (stage === 'error') setStage('input');
  }, [stage]);

  const handleConfirm = useCallback(async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      const result = await onWithdraw(numericAmount);
      if (result.success) {
        setStage('success');
        Animated.parallel([
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.bezier(0.23, 1, 0.32, 1),
            useNativeDriver: true,
          }),
          Animated.spring(successScale, {
            toValue: 1,
            speed: 30,
            bounciness: 4,
            useNativeDriver: true,
          }),
        ]).start();
        setTimeout(() => handleClose(), 2200);
      } else {
        setErrorMessage(result.message || 'Withdrawal failed. Please try again.');
        setStage('error');
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 4, duration: 45, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
        ]).start();
      }
    } finally {
      setLoading(false);
    }
  }, [canConfirm, numericAmount, onWithdraw]);

  const handleClose = useCallback(() => {
    setAmount('');
    setStage('input');
    setErrorMessage('');
    successOpacity.setValue(0);
    successScale.setValue(0.92);
    shakeAnim.setValue(0);
    onClose();
  }, [onClose, successOpacity, successScale, shakeAnim]);

  const confirmLabel = numericAmount >= 1.00
    ? `Confirm withdrawal of $${numericAmount.toFixed(2)}`
    : 'Confirm Withdrawal';

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      title="Withdraw Earnings"
      subtitle={`Available: $${(balance || 0).toFixed(2)}`}
      leftIcon="close-outline"
      keyboardAvoidMaxHeight="80%"
    >
      <View style={styles.content}>
        {stage === 'success' ? (
          <Animated.View
            style={[
              styles.successBlock,
              { opacity: successOpacity, transform: [{ scale: successScale }] },
            ]}
          >
            <View style={[styles.successIconWrap, { backgroundColor: theme.successLighter }]}>
              <Text style={[styles.successIcon, { color: theme.success }]}>$</Text>
            </View>
            <Text style={[styles.successTitle, { color: theme.success }]}>
              Withdrawal submitted
            </Text>
            <Text style={[styles.successBody, { color: theme.textSecondary }]}>
              ${numericAmount.toFixed(2)} has been sent to your account.
            </Text>
          </Animated.View>
        ) : (
          <>
            {stage === 'error' && (
              <Animated.View
                style={[
                  styles.errorBox,
                  { backgroundColor: theme.dangerLighter, transform: [{ translateX: shakeAnim }] },
                ]}
              >
                <Text style={[styles.errorText, { color: theme.danger }]}>{errorMessage}</Text>
              </Animated.View>
            )}

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Amount</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={[
                  styles.amountInput,
                  {
                    backgroundColor: theme.inputBackground,
                    color: theme.textPrimary,
                    borderColor: theme.border,
                  },
                ]}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.placeholderText}
                returnKeyType="done"
                selectTextOnFocus
              />
              <Pressable
                style={({ pressed }) => [
                  styles.allButton,
                  { backgroundColor: theme.primaryLighter },
                  pressed && { opacity: 0.72 },
                ]}
                onPress={handleFillAll}
              >
                <Text style={[styles.allButtonText, { color: theme.primary }]}>All</Text>
              </Pressable>
            </View>

            {numericAmount > 0 && numericAmount < 1.00 && (
              <Text style={[styles.hintText, { color: theme.warning }]}>
                Minimum withdrawal is $1.00
              </Text>
            )}
            {numericAmount > (balance || 0) && numericAmount > 0 && (
              <Text style={[styles.hintText, { color: theme.danger }]}>
                Amount exceeds available balance
              </Text>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                {
                  backgroundColor:
                    canConfirm && !loading ? theme.primaryDark : theme.borderLight,
                },
                pressed && canConfirm && !loading && styles.confirmButtonPressed,
              ]}
              onPress={handleConfirm}
              disabled={!canConfirm || loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.textInverse} size="small" />
              ) : (
                <Text
                  style={[
                    styles.confirmText,
                    { color: canConfirm ? theme.textInverse : theme.textTertiary },
                  ]}
                >
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(20),
    paddingTop: hp(20),
    paddingBottom: hp(48),
  },
  fieldLabel: {
    fontSize: fp(14),
    fontWeight: '600',
    marginBottom: hp(8),
  },
  amountRow: {
    flexDirection: 'row',
    gap: wp(10),
    marginBottom: hp(10),
  },
  amountInput: {
    flex: 1,
    height: hp(52),
    borderRadius: wp(12),
    borderWidth: 1,
    paddingHorizontal: wp(16),
    fontSize: fp(20),
    fontWeight: '600',
  },
  allButton: {
    paddingHorizontal: wp(18),
    borderRadius: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  allButtonText: {
    fontSize: fp(14),
    fontWeight: '700',
  },
  hintText: {
    fontSize: fp(12),
    fontWeight: '500',
    marginBottom: hp(8),
  },
  confirmButton: {
    borderRadius: wp(14),
    height: hp(54),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(8),
  },
  confirmButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  confirmText: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  errorBox: {
    borderRadius: wp(10),
    padding: wp(14),
    marginBottom: hp(16),
  },
  errorText: {
    fontSize: fp(14),
    fontWeight: '500',
  },
  successBlock: {
    alignItems: 'center',
    paddingVertical: hp(36),
  },
  successIconWrap: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  successIcon: {
    fontSize: fp(28),
    fontWeight: '700',
  },
  successTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    marginBottom: hp(8),
  },
  successBody: {
    fontSize: fp(15),
    textAlign: 'center',
    lineHeight: fp(15) * 1.5,
  },
});
