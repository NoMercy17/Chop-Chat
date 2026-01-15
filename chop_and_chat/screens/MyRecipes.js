import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp, SPACING } from '../utils/responsive';
import { useTheme } from '../context/ThemeContext';

// Sample data 
const SAMPLE_RECIPES = [
  { id: 1, title: 'Pasta Carbonara', cookTime: 30, difficulty: 'easy', category: 'dinner', image: null },
  { id: 2, title: 'Morning Pancakes', cookTime: 20, difficulty: 'easy', category: 'breakfast', image: null },
  { id: 3, title: 'Grilled Salmon', cookTime: 25, difficulty: 'medium', category: 'dinner', image: null },
  { id: 4, title: 'Caesar Salad', cookTime: 15, difficulty: 'easy', category: 'lunch', image: null },
];

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert'];

export default function MyRecipes({ navigation }) {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recipes, setRecipes] = useState(SAMPLE_RECIPES);

  const filteredRecipes = selectedCategory === 'All' 
    ? recipes 
    : recipes.filter(r => r.category.toLowerCase() === selectedCategory.toLowerCase());

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.categoryWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category}
              style={({ pressed }) => [
                styles.categoryTab,
                selectedCategory === category && styles.categoryTabActive,
                pressed && styles.categoryTabPressed
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive
              ]}>
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Recipe Grid */}
      {filteredRecipes.length > 0 ? (
        <ScrollView 
          style={styles.recipeList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.recipeGrid}
        >
          {filteredRecipes.map((recipe) => (
            <Pressable
              key={recipe.id}
              style={({ pressed }) => [
                styles.recipeCard,
                pressed && styles.recipeCardPressed
              ]}
              onPress={() => console.log('Recipe pressed:', recipe.id)}
            >
              <View style={styles.recipeImageContainer}>
                {recipe.image ? (
                  <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="restaurant-outline" size={fp(32)} color="#9CA3AF" />
                  </View>
                )}
              </View>
              
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
                
                <View style={styles.recipeMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={fp(14)} color="#6B7280" />
                    <Text style={styles.metaText}>{recipe.cookTime}min</Text>
                  </View>
                  
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) + '20' }]}>
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(recipe.difficulty) }]}>
                      {recipe.difficulty}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        /* Empty State */
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="book-outline" size={fp(48)} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No recipes yet</Text>
          <Text style={styles.emptySubtitle}>Start by adding your first recipe!</Text>
          <Pressable 
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed
            ]}
            onPress={() => console.log('Add recipe')}
          >
            <Ionicons name="add" size={fp(20)} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Recipe</Text>
          </Pressable>
        </View>
      )}

      {/* Floating Add Button */}
      {filteredRecipes.length > 0 && (
        <Pressable 
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed
          ]}
          onPress={() => console.log('Add recipe')}
        >
          <Ionicons name="add" size={fp(28)} color="#FFFFFF" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Category Tabs
  categoryWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: hp(12),
    gap: wp(10),
  },
  categoryTab: {
    paddingHorizontal: wp(18),
    paddingVertical: hp(10),
    borderRadius: wp(24),
    backgroundColor: '#F3F4F6',
  },
  categoryTabActive: {
    backgroundColor: '#3B82F6',
  },
  categoryTabPressed: {
    opacity: 0.8,
  },
  categoryText: {
    fontSize: fp(14),
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },

  // Recipe Grid
  recipeList: {
    flex: 1,
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.itemGap,
    paddingBottom: hp(80),
  },
  recipeCard: {
    width: (wp(393) - SPACING.screenPadding * 2 - SPACING.itemGap) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: SPACING.radiusLarge,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp(2) },
    shadowOpacity: 0.08,
    shadowRadius: wp(8),
    elevation: 3,
  },
  recipeCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  recipeImageContainer: {
    width: '100%',
    height: hp(120),
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    padding: SPACING.cardPadding,
    gap: hp(8),
  },
  recipeTitle: {
    fontSize: fp(15),
    fontWeight: '600',
    color: '#111827',
    lineHeight: fp(20),
  },
  recipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  metaText: {
    fontSize: fp(12),
    color: '#6B7280',
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: wp(6),
  },
  difficultyText: {
    fontSize: fp(11),
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
  },
  emptyIconContainer: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  emptyTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: hp(8),
  },
  emptySubtitle: {
    fontSize: fp(14),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: hp(24),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    backgroundColor: '#3B82F6',
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
    borderRadius: SPACING.radiusLarge,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    fontSize: fp(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: hp(24),
    right: SPACING.screenPadding,
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: hp(4) },
    shadowOpacity: 0.3,
    shadowRadius: wp(8),
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
});
