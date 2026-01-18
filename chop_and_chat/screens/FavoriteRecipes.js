import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp, fp, SPACING } from '../utils/responsive';
import { useTheme } from '../context/ThemeContext';
import DishDetailModal from '../components/posts/DishDetailModal';

// Sample data - will be replaced with real data later
const SAMPLE_FAVORITES = [
  { 
    id: 1, 
    title: 'Pasta Carbonara', 
    cookTime: 30, 
    difficulty: 'Easy', 
    author: 'Chef Maria', 
    rating: 4.8, 
    image: null, 
    ingredients: ['2 cups pasta', '3 eggs', '200g pancetta', '100g parmesan', '1 tsp black pepper'],
    description: 'Classic Italian pasta dish with creamy egg sauce and crispy pancetta.',
    instructions: 'Cook pasta in salted water until al dente.\n\nWhile pasta cooks, fry pancetta until crispy.\n\nWhisk eggs with grated parmesan and pepper.\n\nDrain pasta, reserving some water. Mix with pancetta.\n\nRemove from heat, add egg mixture. Toss quickly.\n\nServe immediately with extra parmesan.',
    utensils: ['pot', 'pan', 'whisk']
  },
  { 
    id: 2, 
    title: 'Thai Green Curry', 
    cookTime: 45, 
    difficulty: 'Medium', 
    author: 'Chef Antoine', 
    rating: 4.5, 
    image: null, 
    ingredients: ['500g chicken breast', '400ml coconut milk', '3 tbsp green curry paste', 'Thai basil', '100g bamboo shoots'],
    description: 'Aromatic and spicy Thai curry with tender chicken and vegetables.',
    instructions: 'Cut chicken into bite-sized pieces.\n\nHeat oil in a wok, fry curry paste until fragrant.\n\nAdd coconut milk and bring to simmer.\n\nAdd chicken and cook for 10 minutes.\n\nAdd bamboo shoots and Thai basil.\n\nServe with jasmine rice.',
    utensils: ['wok', 'stove']
  },
  { 
    id: 3, 
    title: 'Beef Wellington', 
    cookTime: 120, 
    difficulty: 'Hard', 
    author: 'Chef Gordon', 
    rating: 4.9, 
    image: null, 
    ingredients: ['800g beef tenderloin', '400g mushrooms', '500g puff pastry', '100g prosciutto', '2 tbsp Dijon mustard'],
    description: 'A showstopper dish with tender beef wrapped in mushroom duxelles and flaky pastry.',
    instructions: 'Sear beef on all sides. Let cool, brush with mustard.\n\nBlitz mushrooms, cook until dry to make duxelles.\n\nLay prosciutto on plastic wrap, spread duxelles.\n\nPlace beef on top, roll tightly. Chill for 30 minutes.\n\nWrap in puff pastry. Brush with egg wash.\n\nBake at 220°C for 25-30 minutes.',
    utensils: ['oven', 'pan', 'food processor']
  },
  { 
    id: 4, 
    title: 'Caesar Salad', 
    cookTime: 15, 
    difficulty: 'Easy', 
    author: 'Carmen', 
    rating: 4.2, 
    image: null, 
    ingredients: ['1 head romaine lettuce', '1 cup croutons', '50g parmesan', '100ml caesar dressing', '4 anchovies'],
    description: 'Crisp and refreshing salad with homemade dressing and crunchy croutons.',
    instructions: 'Wash and dry romaine lettuce. Tear into pieces.\n\nMake dressing: blend anchovies, garlic, egg yolk, lemon juice, and oil.\n\nToss lettuce with dressing.\n\nTop with croutons and shaved parmesan.\n\nServe immediately.',
    utensils: ['bowl', 'blender']
  },
  { 
    id: 5, 
    title: 'Sushi Rolls', 
    cookTime: 60, 
    difficulty: 'Hard', 
    author: 'Marcel', 
    rating: 4.7, 
    image: null, 
    ingredients: ['300g sushi rice', '4 nori sheets', '200g fresh salmon', '1 avocado', '1 cucumber'],
    description: 'Fresh and delicate maki rolls with salmon and avocado.',
    instructions: 'Rinse rice until water runs clear. Cook with 1.2x water.\n\nSeason rice with rice vinegar, sugar, and salt.\n\nPlace nori on bamboo mat, spread rice evenly.\n\nAdd salmon, avocado, cucumber strips.\n\nRoll tightly using the mat.\n\nSlice with wet knife. Serve with soy sauce.',
    utensils: ['rice cooker', 'bamboo mat']
  },
  { 
    id: 6, 
    title: 'Tiramisu', 
    cookTime: 40, 
    difficulty: 'Medium', 
    author: 'Sofia', 
    rating: 4.9, 
    image: null, 
    ingredients: ['500g mascarpone', '300ml espresso', '200g ladyfingers', '2 tbsp cocoa powder', '4 eggs'],
    description: 'Classic Italian dessert with layers of coffee-soaked ladyfingers and mascarpone cream.',
    instructions: 'Separate eggs. Beat yolks with sugar until pale.\n\nFold in mascarpone until smooth.\n\nWhip egg whites to stiff peaks, fold into mixture.\n\nDip ladyfingers quickly in espresso.\n\nLayer in dish: ladyfingers, cream, repeat.\n\nRefrigerate 4 hours. Dust with cocoa before serving.',
    utensils: ['mixer', 'dish']
  },
  { 
    id: 7, 
    title: 'Chicken Tacos', 
    cookTime: 25, 
    difficulty: 'Easy', 
    author: 'Diego', 
    rating: 4.4, 
    image: null, 
    ingredients: ['400g chicken breast', '8 corn tortillas', '200g salsa', '1 avocado', '2 limes', 'Fresh cilantro'],
    description: 'Quick and flavorful Mexican tacos with juicy seasoned chicken.',
    instructions: 'Season chicken with cumin, chili, salt.\n\nGrill or pan-fry until cooked through.\n\nSlice chicken into strips.\n\nWarm tortillas on dry pan.\n\nAssemble: chicken, salsa, avocado slices.\n\nTop with cilantro and lime juice.',
    utensils: ['grill', 'pan']
  },
  { 
    id: 8, 
    title: 'Mushroom Risotto', 
    cookTime: 50, 
    difficulty: 'Medium', 
    author: 'Elena', 
    rating: 4.6, 
    image: null, 
    ingredients: ['300g arborio rice', '400g mixed mushrooms', '150ml white wine', '80g parmesan', '50g butter'],
    description: 'Creamy and earthy Italian risotto with mixed mushrooms.',
    instructions: 'Sauté mushrooms in butter, set aside.\n\nSauté onion, add rice, toast for 2 minutes.\n\nAdd wine, stir until absorbed.\n\nAdd warm stock one ladle at a time, stirring constantly.\n\nAfter 18 minutes, fold in mushrooms, butter, parmesan.\n\nRest 2 minutes before serving.',
    utensils: ['pan', 'stove']
  },
  { 
    id: 9, 
    title: 'Chocolate Lava Cake', 
    cookTime: 20, 
    difficulty: 'Medium', 
    author: 'Chef Maria', 
    rating: 4.8, 
    image: null, 
    ingredients: ['200g dark chocolate', '100g butter', '2 eggs', '50g flour', '80g sugar'],
    description: 'Decadent individual cakes with a molten chocolate center.',
    instructions: 'Melt chocolate and butter together.\n\nWhisk eggs and sugar until light.\n\nFold chocolate mixture into eggs.\n\nAdd flour, mix gently.\n\nPour into greased ramekins.\n\nBake at 200°C for 10-12 minutes. Center should wobble.',
    utensils: ['oven', 'ramekins', 'bowl']
  },
  { 
    id: 10, 
    title: 'Greek Salad', 
    cookTime: 10, 
    difficulty: 'Easy', 
    author: 'Nikos', 
    rating: 4.3, 
    image: null, 
    ingredients: ['4 ripe tomatoes', '1 cucumber', '200g feta cheese', '100g Kalamata olives', '4 tbsp olive oil', '1 tsp dried oregano'],
    description: 'Simple and fresh Mediterranean salad with quality ingredients.',
    instructions: 'Cut tomatoes into wedges.\n\nSlice cucumber into half-moons.\n\nCube feta cheese.\n\nCombine vegetables in a bowl.\n\nAdd olives and feta on top.\n\nDrizzle with olive oil, sprinkle oregano.',
    utensils: ['bowl', 'knife']
  },
];

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

export default function FavoriteRecipes({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [favorites, setFavorites] = useState(SAMPLE_FAVORITES);
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);

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
    switch (difficulty?.toLowerCase()) {
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
    <View style={[styles.container, { backgroundColor: theme.screenBackground, paddingTop: insets.top }]}>
      {/* Back Button and Header Title */}
      <View style={[styles.headerContainer, { backgroundColor: theme.screenBackground }]}>
        <Pressable 
          style={({ pressed }) => [
            styles.backButton,
            !isDarkMode && styles.backButtonLight,
            pressed && styles.backButtonPressed
          ]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={fp(24)} color={theme.headerTitleColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.headerTitleColor }]}>Favorites</Text>
      </View>

      {/* Search by Keyword */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputWrapper, { backgroundColor: theme.inputBackground }]}>
          <Ionicons name="search-outline" size={fp(20)} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search by keyword..."
            placeholderTextColor={theme.placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={fp(20)} color={theme.textTertiary} />
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
                { backgroundColor: theme.inputBackground },
                selectedDifficulty === difficulty && styles.filterTabActive,
                pressed && styles.filterTabPressed
              ]}
              onPress={() => setSelectedDifficulty(difficulty)}
            >
              <Text style={[
                styles.filterText,
                { color: theme.textSecondary },
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
                { backgroundColor: theme.cardBackground },
                pressed && styles.recipeCardPressed
              ]}
              onPress={() => {
                setSelectedDish(recipe);
                setDishDetailModalVisible(true);
              }}
            >
              {/* Recipe Image */}
              <View style={styles.recipeImageContainer}>
                {recipe.image ? (
                  <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
                ) : (
                  <View style={[styles.imagePlaceholder, { backgroundColor: theme.inputBackground }]}>
                    <Ionicons name="restaurant-outline" size={fp(28)} color="#9CA3AF" />
                  </View>
                )}
              </View>

              {/* Recipe Info */}
              <View style={[styles.recipeInfo, { backgroundColor: theme.postContentBackground }]}>
                <Text style={[styles.recipeTitle, { color: theme.textPrimary }]} numberOfLines={1}>{recipe.title}</Text>
                <Text style={[styles.recipeAuthor, { color: theme.textSecondary }]}>by {recipe.author}</Text>
                
                <View style={styles.recipeMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={fp(14)} color={theme.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>{recipe.cookTime}min</Text>
                  </View>
                  
                  <View style={styles.metaItem}>
                    <Ionicons name="star" size={fp(14)} color="#FBBF24" />
                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>{recipe.rating}</Text>
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
                style={[styles.heartButton, { backgroundColor: theme.postContentBackground }]}
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
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="bookmark-outline" size={fp(48)} color={theme.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No favorites found</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {searchQuery || selectedDifficulty !== 'All' 
              ? 'Try adjusting your filters'
              : 'Heart a recipe to save it here!'}
          </Text>
        </View>
      )}

      {/* Dish Detail Modal */}
      <DishDetailModal
        visible={dishDetailModalVisible}
        onClose={() => {
          setDishDetailModalVisible(false);
          setSelectedDish(null);
        }}
        dish={selectedDish}
        showChefReviewButton={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header with Back Button and Title
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: wp(12),
    paddingVertical: hp(12),
  },
  headerTitle: {
    fontSize: fp(28),
    fontWeight: '700',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: wp(12),
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },

  // Search
  searchContainer: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: hp(16),
    paddingBottom: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: hp(16),
    paddingBottom: hp(12),
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
    paddingTop: hp(20),
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
