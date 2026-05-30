import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';

export default function ChefEarningsCard({ balance, loading, onWithdraw, onSetupPayouts, stripeOnboarded, onboardLoading, theme }) {
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(8)).current;
  const balanceScale = useRef(new Animated.Value(1)).current;
  const prevBalance = useRef(balance);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 280,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (loading || prevBalance.current === balance) return;
    prevBalance.current = balance;
    Animated.sequence([
      Animated.spring(balanceScale, { toValue: 1.06, speed: 40, bounciness: 3, useNativeDriver: true }),
      Animated.spring(balanceScale, { toValue: 1, speed: 40, bounciness: 3, useNativeDriver: true }),
    ]).start();
  }, [balance, loading]);

  const notOnboarded = stripeOnboarded === false;
  const canWithdraw = typeof balance === 'number' && balance >= 1.00 && !loading && !notOnboarded;

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor },
        { opacity: cardOpacity, transform: [{ translateY: cardSlide }] },
      ]}
    >
      <Text style={[styles.label, { color: theme.textTertiary }]}>CHEF EARNINGS</Text>
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.success} style={styles.loader} />
        ) : (
          <Animated.Text
            style={[
              styles.amount,
              { color: theme.success },
              { transform: [{ scale: balanceScale }] },
            ]}
          >
            {(balance || 0).toFixed(2)} RON
          </Animated.Text>
        )}
        {notOnboarded ? (
          <Pressable
            style={({ pressed }) => [
              styles.withdrawButton,
              {
                backgroundColor: theme.primaryLighter,
                borderWidth: 1,
                borderColor: theme.primary,
              },
              pressed && styles.withdrawButtonPressed,
            ]}
            onPress={onSetupPayouts}
            disabled={onboardLoading}
          >
            {onboardLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <View style={styles.setupRow}>
                <Text style={[styles.withdrawText, { color: theme.primary }]}>Set up Payouts</Text>
                <Ionicons name="chevron-forward" size={fp(13)} color={theme.primary} />
              </View>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.withdrawButton,
              {
                backgroundColor: canWithdraw ? theme.primaryLighter : theme.borderLight,
                borderWidth: 1,
                borderColor: canWithdraw ? theme.primary : theme.border,
              },
              pressed && styles.withdrawButtonPressed,
            ]}
            onPress={onWithdraw}
          >
            <Text style={[styles.withdrawText, { color: canWithdraw ? theme.primary : theme.textTertiary }]}>
              Withdraw
            </Text>
          </Pressable>
        )}
      </View>
      {notOnboarded ? (
        <Text style={[styles.hint, { color: theme.textTertiary }]}>
          Connect Stripe to withdraw your earnings
        </Text>
      ) : !loading && balance < 1.00 ? (
        <Text style={[styles.hint, { color: theme.textTertiary }]}>
          {balance === 0 ? 'Earn from roasts to withdraw' : 'Withdraw unlocks at 1.00 RON'}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: wp(20),
    marginBottom: hp(12),
    borderRadius: wp(18),
    paddingHorizontal: wp(20),
    paddingTop: hp(16),
    paddingBottom: hp(18),
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  label: {
    fontSize: fp(10),
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: hp(8),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loader: {
    height: fp(36),
    alignSelf: 'center',
  },
  amount: {
    fontSize: fp(32),
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  withdrawButton: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(9),
    borderRadius: wp(12),
  },
  withdrawButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  withdrawText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  setupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  hint: {
    fontSize: fp(11),
    marginTop: hp(6),
  },
});
