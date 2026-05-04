import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp, SPACING } from '../../utils/responsive';

/**
 * Shared header for screens with category tabs and a back button.
 */
export default function CategoryHeader({ 
  categories, 
  selectedCategory, 
  onSelectCategory, 
  onBack, 
  theme 
}) {
  return (
    <View style={[styles.categoryWrapper, { backgroundColor: theme.screenBackground }]}>
      <Pressable 
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed
        ]}
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={fp(24)} color="rgba(255, 255, 255, 0.85)" />
      </Pressable>
      <View style={styles.categoryContainer}>
        {categories.map((category) => (
          <Pressable
            key={category}
            style={({ pressed }) => [
              styles.categoryTab,
              selectedCategory === category && styles.categoryTabActive,
              pressed && styles.categoryTabPressed
            ]}
            onPress={() => onSelectCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryWrapper: {
    paddingTop: hp(8),
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(12),
  },
  backButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  categoryContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    gap: wp(40),
  },
  categoryTab: {
    paddingVertical: hp(12),
    paddingHorizontal: wp(8),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  categoryTabActive: {
    borderBottomColor: '#FFFFFF',
  },
  categoryTabPressed: {
    opacity: 0.7,
  },
  categoryText: {
    fontSize: fp(16),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
});
