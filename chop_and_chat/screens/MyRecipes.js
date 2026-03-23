import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp, fp, SPACING } from '../utils/responsive';
import { useTheme } from '../context/ThemeContext';
import DishDetailModal from '../components/posts/DishDetailModal';
import CommentsModal from '../components/posts/CommentsModal';
import RecipeCard from '../components/posts/RecipeCard';
import { mockMyRecipes, mockMyRecipesComments } from '../data/mockData';

export default function MyPostsScreen({ navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [myPosts, setMyPosts] = useState(mockMyRecipes);

  const handleLike = (postId) => {
    setMyPosts(currentPosts => currentPosts.map(post => 
      post.id === postId ? { ...post, likes: post.liked ? post.likes - 1 : post.likes + 1, liked: !post.liked } : post
    ));
  };

  const handleComment = (post) => {
    setSelectedPost(post);
    setCommentsModalVisible(true);
  };

  const handleAddComment = () => {
    if (newComment.trim() && selectedPost) {
      setMyPosts(currentPosts => currentPosts.map(post => 
        post.id === selectedPost.id ? { ...post, comments: post.comments + 1 } : post
      ));
      setNewComment('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.screenBackground, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: theme.screenBackground }]}>
        <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={fp(24)} color="rgba(255, 255, 255, 0.85)" />
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
              <Ionicons name="add" size={fp(20)} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create Recipe</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <CommentsModal 
        visible={commentsModalVisible}
        onClose={() => setCommentsModalVisible(false)}
        comments={selectedPost ? mockMyRecipesComments[selectedPost.id] : []}
        newComment={newComment}
        onCommentChange={setNewComment}
        onAddComment={handleAddComment}
        theme={theme}
      />

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
  backButton: { width: wp(40), height: wp(40), borderRadius: wp(20), backgroundColor: 'rgba(0, 0, 0, 0.15)', justifyContent: 'center', alignItems: 'center' },
  backButtonPressed: { opacity: 0.7 },
  headerTitle: { fontSize: fp(20), fontWeight: '700' },
  content: { padding: wp(16), paddingBottom: hp(40) },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: hp(100), paddingHorizontal: wp(40) },
  emptyIconContainer: { width: wp(100), height: wp(100), borderRadius: wp(50), justifyContent: 'center', alignItems: 'center', marginBottom: hp(20) },
  emptyTitle: { fontSize: fp(20), fontWeight: '700', marginBottom: hp(8) },
  emptySubtitle: { fontSize: fp(15), textAlign: 'center', marginBottom: hp(24), lineHeight: fp(22) },
  createButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp(24), paddingVertical: hp(12), borderRadius: wp(12), gap: wp(8) },
  createButtonText: { color: '#FFFFFF', fontSize: fp(16), fontWeight: '600' },
  createButtonPressed: { opacity: 0.9 }
});
