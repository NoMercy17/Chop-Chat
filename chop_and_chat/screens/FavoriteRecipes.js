import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp, SPACING } from '../utils/responsive';

// Sample data - will be replaced with real data later
const SAMPLE_FAVORITES = [
  { id: 1, title: 'Pasta Carbonara', cookTime: 30, difficulty: 'easy', author: 'Chef Maria', rating: 4.8, image: null, ingredients: ['pasta', 'eggs', 'pancetta', 'parmesan', 'black pepper'] },
  { id: 2, title: 'Thai Green Curry', cookTime: 45, difficulty: 'medium', author: 'Chef Antoine', rating: 4.5, image: null, ingredients: ['chicken', 'coconut milk', 'green curry paste', 'basil', 'bamboo shoots'] },
  { id: 3, title: 'Beef Wellington', cookTime: 120, difficulty: 'hard', author: 'Chef Gordon', rating: 4.9, image: null, ingredients: ['beef tenderloin', 'mushrooms', 'puff pastry', 'prosciutto', 'mustard'] },
  { id: 4, title: 'Caesar Salad', cookTime: 15, difficulty: 'easy', author: 'Carmen', rating: 4.2, image: null, ingredients: ['romaine lettuce', 'croutons', 'parmesan', 'caesar dressing', 'anchovies'] },
  { id: 5, title: 'Sushi Rolls', cookTime: 60, difficulty: 'hard', author: 'Marcel', rating: 4.7, image: null, ingredients: ['sushi rice', 'nori', 'salmon', 'avocado', 'cucumber'] },
  { id: 6, title: 'Tiramisu', cookTime: 40, difficulty: 'medium', author: 'Sofia', rating: 4.9, image: null, ingredients: ['mascarpone', 'espresso', 'ladyfingers', 'cocoa powder', 'eggs'] },
  { id: 7, title: 'Chicken Tacos', cookTime: 25, difficulty: 'easy', author: 'Diego', rating: 4.4, image: null, ingredients: ['chicken', 'tortillas', 'salsa', 'avocado', 'lime', 'cilantro'] },
  { id: 8, title: 'Mushroom Risotto', cookTime: 50, difficulty: 'medium', author: 'Elena', rating: 4.6, image: null, ingredients: ['arborio rice', 'mushrooms', 'white wine', 'parmesan', 'butter'] },
  { id: 9, title: 'Chocolate Lava Cake', cookTime: 20, difficulty: 'medium', author: 'Chef Maria', rating: 4.8, image: null, ingredients: ['dark chocolate', 'butter', 'eggs', 'flour', 'sugar'] },
  { id: 10, title: 'Greek Salad', cookTime: 10, difficulty: 'easy', author: 'Nikos', rating: 4.3, image: null, ingredients: ['tomatoes', 'cucumber', 'feta', 'olives', 'olive oil', 'oregano'] },
];

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

export default function FavoriteRecipes({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [favorites, setFavorites] = useState(SAMPLE_FAVORITES);

  const filteredFavorites = favorites.filter(recipe => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      recipe.title.toLowerCase().includes(query) ||
      recipe.author.toLowerCase().includes(query) ||
      recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(query));
    const matchesDifficulty = selectedDifficulty === 'All' || 
      recipe.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const removeFavorite = (id) => {
    setFavorites(prev => prev.filter(r => r.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* Search by Keyword */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={fp(20)} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by keyword..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={fp(20)} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Difficulty Filter */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {DIFFICULTIES.map((difficulty) => (
            <Pressable
              key={difficulty}
              style={({ pressed }) => [
                styles.filterTab,
                selectedDifficulty === difficulty && styles.filterTabActive,
                pressed && styles.filterTabPressed
              ]}
              onPress={() => setSelectedDifficulty(difficulty)}
            >
              <Text style={[
                styles.filterText,
                selectedDifficulty === difficulty && styles.filterTextActive
              ]}>
                {difficulty}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Favorites List */}
      {filteredFavorites.length > 0 ? (
        <ScrollView 
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {filteredFavorites.map((recipe) => (
            <Pressable
              key={recipe.id}
              style={({ pressed }) => [
                styles.recipeCard,
                pressed && styles.recipeCardPressed
              ]}
              onPress={() => console.log('Recipe pressed:', recipe.id)}
            >
              {/* Recipe Image */}
              <View style={styles.recipeImageContainer}>
                {recipe.image ? (
                  <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="restaurant-outline" size={fp(28)} color="#9CA3AF" />
                  </View>
                )}
              </View>

              {/* Recipe Info */}
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
                <Text style={styles.recipeAuthor}>by {recipe.author}</Text>
                
                <View style={styles.recipeMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={fp(14)} color="#6B7280" />
                    <Text style={styles.metaText}>{recipe.cookTime}min</Text>
                  </View>
                  
                  <View style={styles.metaItem}>
                    <Ionicons name="star" size={fp(14)} color="#FBBF24" />
                    <Text style={styles.metaText}>{recipe.rating}</Text>
                  </View>

                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) + '20' }]}>
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(recipe.difficulty) }]}>
                      {recipe.difficulty}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Favorite Button */}
              <Pressable 
                style={styles.heartButton}
                onPress={() => removeFavorite(recipe.id)}
              >
                <Ionicons name="bookmark" size={fp(24)} color="#EF4444" />
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        /* Empty State */
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bookmark-outline" size={fp(48)} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No favorites found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || selectedDifficulty !== 'All' 
              ? 'Try adjusting your filters'
              : 'Heart a recipe to save it here!'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Search
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: SPACING.radiusMedium,
    paddingHorizontal: wp(14),
    paddingVertical: hp(10),
    gap: wp(10),
  },
  searchInput: {
    flex: 1,
    fontSize: fp(16),
    color: '#111827',
  },

  // Filter Tabs
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: hp(12),
    gap: wp(10),
  },
  filterTab: {
    paddingHorizontal: wp(18),
    paddingVertical: hp(8),
    borderRadius: wp(20),
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabPressed: {
    opacity: 0.8,
  },
  filterText: {
    fontSize: fp(14),
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Recipe List
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: hp(16),
    paddingBottom: hp(32),
    gap: SPACING.itemGap,
  },
  recipeCard: {
    flexDirection: 'row',
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
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  recipeImageContainer: {
    width: wp(100),
    height: hp(100),
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
    flex: 1,
    padding: SPACING.cardPadding,
    justifyContent: 'center',
    gap: hp(4),
  },
  recipeTitle: {
    fontSize: fp(16),
    fontWeight: '600',
    color: '#111827',
  },
  recipeAuthor: {
    fontSize: fp(13),
    color: '#6B7280',
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
    marginTop: hp(4),
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
  heartButton: {
    justifyContent: 'center',
    paddingHorizontal: wp(16),
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
  },
});
