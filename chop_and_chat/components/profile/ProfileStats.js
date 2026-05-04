import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { wp, hp, fp } from '../../utils/responsive';

export default function ProfileStats({ recipeCount, followersCount, followingCount, theme, onRecipesPress, onFollowersPress, onFollowingPress }) {
  return (
    <View style={[styles.statsBar, { backgroundColor: theme.cardBackground }]}>
      <Pressable style={styles.statItem} onPress={onRecipesPress}>
        <Text style={[styles.statValue, { color: theme.textPrimary }]}>{recipeCount}</Text>
        <Text style={[styles.statText, { color: theme.textSecondary }]}>Recipes</Text>
      </Pressable>
      <Pressable style={styles.statItem} onPress={onFollowersPress}>
        <Text style={[styles.statValue, { color: theme.textPrimary }]}>{followersCount}</Text>
        <Text style={[styles.statText, { color: theme.textSecondary }]}>Followers</Text>
      </Pressable>
      <Pressable style={styles.statItem} onPress={onFollowingPress}>
        <Text style={[styles.statValue, { color: theme.textPrimary }]}>{followingCount}</Text>
        <Text style={[styles.statText, { color: theme.textSecondary }]}>Following</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  statsBar: { flexDirection: "row", justifyContent: "space-around", marginVertical: hp(18), marginHorizontal: wp(20), padding: wp(12), borderRadius: wp(12), elevation: 2 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: fp(20), fontWeight: "700" },
  statText: { fontSize: fp(12) },
});
