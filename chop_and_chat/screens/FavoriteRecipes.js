import React, { useState, useContext, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { wp, hp, fp, SPACING } from '../utils/responsive';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { usePosts } from '../context/PostsContext';
import { useChefFeed } from '../context/ChefFeedContext';
import DishDetailModal from '../components/posts/DishDetailModal';
import RecipeCard from '../components/posts/RecipeCard';

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

export default function FavoriteRecipes({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useContext(AuthContext);
  const { markUnsaved } = usePosts();
  const { unsaveByPostId } = useChefFeed();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get('/posts/saved', token);
      setFavorites(data || []);
    } catch (error) {
      console.error('[FavoriteRecipes] loadFavorites:', error.message);
    }
  }, [token]);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);
  useFocusEffect(useCallback(() => { loadFavorites(); }, [loadFavorites]));

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

  const removeFavorite = async (id) => {
    setFavorites(prev => prev.filter(r => r.id !== id));
    markUnsaved(id);
    unsaveByPostId(id);
    try {
      await api.post('/posts/save', { post_id: id }, token);
    } catch (error) {
      console.error('[FavoriteRecipes] removeFavorite:', error.message);
      loadFavorites();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.screenBackground, paddingTop: insets.top }]}>
      {/* Header */}
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
        <View style={{ width: wp(40) }} />
      </View>

      {/* Search */}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {DIFFICULTIES.map((difficulty) => (
            <Pressable
              key={difficulty}
              style={({ pressed }) => [
                styles.filterTab,
                { backgroundColor: selectedDifficulty === difficulty ? theme.primary : theme.inputBackground },
                pressed && styles.filterTabPressed
              ]}
              onPress={() => setSelectedDifficulty(difficulty)}
            >
              <Text style={[
                styles.filterText,
                { color: selectedDifficulty === difficulty ? theme.textInverse : theme.textSecondary }
              ]}>
                {difficulty}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {filteredFavorites.length > 0 ? (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {filteredFavorites.map((recipe) => (
            <RecipeCard 
              key={recipe.id}
              recipe={recipe}
              variant="detailed"
              theme={theme}
              rightActionIcon="bookmark"
              onRightAction={removeFavorite}
              onPress={() => {
                setSelectedDish(recipe);
                setDishDetailModalVisible(true);
              }}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="bookmark-outline" size={fp(48)} color={theme.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No favorites found</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {searchQuery || selectedDifficulty !== 'All' ? 'Try adjusting your filters' : 'Heart a recipe to save it here!'}
          </Text>
        </View>
      )}

      <DishDetailModal
        visible={dishDetailModalVisible}
        onClose={() => { setDishDetailModalVisible(false); setSelectedDish(null); }}
        dish={selectedDish}
        showChefReviewButton={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.screenPadding, paddingVertical: hp(12) },
  backButton: { width: wp(40), height: wp(40), borderRadius: wp(20), backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  backButtonLight: { backgroundColor: 'rgba(0, 0, 0, 0.05)' },
  backButtonPressed: { opacity: 0.7 },
  headerTitle: { fontSize: fp(24), fontWeight: '700' },
  searchContainer: { paddingHorizontal: SPACING.screenPadding, marginBottom: hp(16) },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp(12), borderRadius: wp(12), height: hp(48) },
  searchInput: { flex: 1, marginLeft: wp(8), fontSize: fp(16) },
  filterContainer: { marginBottom: hp(20) },
  filterScroll: { paddingHorizontal: SPACING.screenPadding, gap: wp(10) },
  filterTab: { paddingHorizontal: wp(16), paddingVertical: hp(8), borderRadius: wp(20) },
  filterText: { fontSize: fp(14), fontWeight: '600' },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: SPACING.screenPadding, paddingBottom: hp(30) },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(40) },
  emptyIconContainer: { width: wp(100), height: wp(100), borderRadius: wp(50), justifyContent: 'center', alignItems: 'center', marginBottom: hp(20) },
  emptyTitle: { fontSize: fp(20), fontWeight: '700', marginBottom: hp(8) },
  emptySubtitle: { fontSize: fp(15), textAlign: 'center', lineHeight: fp(22) }
});
