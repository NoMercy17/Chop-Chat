import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { wp, hp, fp } from '../../utils/responsive';

export default function ProfileStats({ recipeCount, followersCount, followingCount, theme, onRecipesPress, onFollowersPress, onFollowingPress }) {
  return (
    <View style={styles.container}>
      {/* Hero stat — Recipes is the primary identity of a profile */}
      <Pressable
        style={({ pressed }) => [styles.heroStat, pressed && styles.pressed]}
        onPress={onRecipesPress}
      >
        <Text style={[styles.heroValue, { color: theme.textPrimary }]}>{recipeCount}</Text>
        <Text style={[styles.heroLabel, { color: theme.primary }]}>RECIPES</Text>
      </Pressable>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.secondaryGroup}>
        <Pressable
          style={({ pressed }) => [styles.secondaryStat, pressed && styles.pressed]}
          onPress={onFollowersPress}
        >
          <Text style={[styles.secondaryValue, { color: theme.textPrimary }]}>{followersCount}</Text>
          <Text style={[styles.secondaryLabel, { color: theme.textSecondary }]}>Followers</Text>
        </Pressable>

        <View style={[styles.innerDivider, { backgroundColor: theme.border }]} />

        <Pressable
          style={({ pressed }) => [styles.secondaryStat, pressed && styles.pressed]}
          onPress={onFollowingPress}
        >
          <Text style={[styles.secondaryValue, { color: theme.textPrimary }]}>{followingCount}</Text>
          <Text style={[styles.secondaryLabel, { color: theme.textSecondary }]}>Following</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(24),
    marginVertical: hp(18),
  },
  heroStat: {
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(6),
    minWidth: wp(90),
  },
  heroValue: {
    fontSize: fp(32),
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: hp(2),
  },
  divider: {
    width: 1,
    height: hp(44),
  },
  secondaryGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(6),
  },
  secondaryValue: {
    fontSize: fp(20),
    fontWeight: '700',
  },
  secondaryLabel: {
    fontSize: fp(11),
    fontWeight: '500',
    marginTop: hp(2),
  },
  innerDivider: {
    width: 1,
    height: hp(28),
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
});
