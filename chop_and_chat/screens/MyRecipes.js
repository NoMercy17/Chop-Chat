import { useState, useContext, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
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

  const loadMyRecipes = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get('/posts/search', token);
      setMyPosts(data?.posts ?? data ?? []);
    } catch (error) {
      console.error('[MyRecipes] loadMyRecipes:', error.message);
    }
  }, [token]);

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

      <ScrollView contentContainerStyle={styles.content}>
        {myPosts.length > 0 ? myPosts.map((post) => (
          <RecipeCard 
            key={post.id}
            recipe={post}
            variant="compact"
            theme={theme}
            onPress={() => { setSelectedDish(post); setDishDetailModalVisible(true); }}
          />
        )) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.inputBackground }]}>
              <Ionicons name="restaurant-outline" size={fp(48)} color={theme.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No recipes yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Create your first recipe and share it with the community!</Text>
            <Pressable style={({ pressed }) => [styles.createButton, { backgroundColor: theme.primary }, pressed && styles.createButtonPressed]} onPress={() => navigation.navigate('Home')}>
              <Ionicons name="add" size={fp(20)} color={theme.textInverse} />
              <Text style={[styles.createButtonText, { color: theme.textInverse }]}>Create Recipe</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

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
  backButtonPressed: { opacity: 0.7 },
  headerTitle: { fontSize: fp(24), fontWeight: '700' },
  content: { paddingHorizontal: wp(16), paddingBottom: hp(40) },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(40) },
  emptyIconContainer: { width: wp(100), height: wp(100), borderRadius: wp(50), justifyContent: 'center', alignItems: 'center', marginBottom: hp(20) },
  emptyTitle: { fontSize: fp(20), fontWeight: '700', marginBottom: hp(8) },
  emptySubtitle: { fontSize: fp(15), textAlign: 'center', marginBottom: hp(24), lineHeight: fp(22) },
  createButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp(24), paddingVertical: hp(12), borderRadius: wp(12), gap: wp(8) },
  createButtonText: { fontSize: fp(16), fontWeight: '600' },
  createButtonPressed: { opacity: 0.9 }
});
