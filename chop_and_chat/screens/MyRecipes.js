import { useState, useContext, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { wp, hp, fp, SPACING } from '../utils/responsive';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import DishDetailModal from '../components/posts/DishDetailModal';
import RecipeCard from '../components/posts/RecipeCard';

export default function MyPostsScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useContext(AuthContext);
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMyRecipes = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get('/posts/mine', token);
      setMyPosts(data?.posts ?? data ?? []);
    } catch (error) {
      console.error('[MyRecipes] loadMyRecipes:', error.message);
    }
  }, [token]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadMyRecipes();
    setIsRefreshing(false);
  }, [loadMyRecipes]);

  useEffect(() => { loadMyRecipes(); }, [loadMyRecipes]);
  useFocusEffect(useCallback(() => { loadMyRecipes(); }, [loadMyRecipes]));

  return (
    <View style={[styles.container, { backgroundColor: theme.screenBackground, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: theme.screenBackground }]}>
        <Pressable style={({ pressed }) => [styles.backButton, !isDarkMode && styles.backButtonLight, pressed && styles.backButtonPressed]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={fp(24)} color={theme.headerTitleColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Recipes</Text>
        <View style={{ width: fp(24) }} />
      </View>

      <FlatList
        data={myPosts}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            variant="grid"
            theme={theme}
            onPress={() => { setSelectedDish(item); setDishDetailModalVisible(true); }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.inputBackground }]}>
              <Ionicons name="restaurant-outline" size={fp(48)} color={theme.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No recipes yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Share your first dish with the community</Text>
          </View>
        }
      />

      {/* Floating action button — always visible, on-brand entry point for new posts */}
      <Pressable
        style={({ pressed }) => [styles.fab, { backgroundColor: theme.primary }, pressed && { opacity: 0.9, transform: [{ scale: 0.93 }] }]}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons name="add" size={fp(26)} color={theme.textInverse} />
      </Pressable>

      <DishDetailModal
        visible={dishDetailModalVisible}
        onClose={() => { setDishDetailModalVisible(false); setSelectedDish(null); }}
        dish={selectedDish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wp(16), paddingVertical: hp(12) },
  backButton: { width: wp(40), height: wp(40), borderRadius: wp(20), backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  backButtonLight: { backgroundColor: 'rgba(0, 0, 0, 0.05)' },
  backButtonPressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  headerTitle: { fontSize: fp(24), fontWeight: '700', letterSpacing: -0.5 },
  gridRow: { paddingHorizontal: wp(20), gap: wp(12), marginBottom: wp(12) },
  gridContent: { paddingBottom: hp(100), paddingTop: hp(4) },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(40), paddingTop: hp(80) },
  emptyIconContainer: { width: wp(100), height: wp(100), borderRadius: wp(50), justifyContent: 'center', alignItems: 'center', marginBottom: hp(20) },
  emptyTitle: { fontSize: fp(20), fontWeight: '700', marginBottom: hp(8) },
  emptySubtitle: { fontSize: fp(15), textAlign: 'center', lineHeight: fp(22) },
  fab: { position: 'absolute', right: wp(20), bottom: hp(30), width: wp(56), height: wp(56), borderRadius: wp(28), justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 5 }
});
