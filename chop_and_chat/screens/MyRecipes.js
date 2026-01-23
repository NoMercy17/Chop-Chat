import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp, fp, SPACING } from '../utils/responsive';
import { useTheme } from '../context/ThemeContext';
import DishDetailModal from '../components/posts/DishDetailModal';
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
    setMyPosts(currentPosts =>
      currentPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: post.liked ? post.likes - 1 : post.likes + 1,
            liked: !post.liked,
          };
        }
        return post;
      })
    );
  };

  const handleSave = (postId) => {
    setMyPosts(currentPosts =>
      currentPosts.map(post => {
        if (post.id === postId) {
          return { ...post, saves: post.saved ? post.saves - 1 : post.saves + 1, saved: !post.saved };
        }
        return post;
      })
    );
  };

  const handleComment = (post) => {
    setSelectedPost(post);
    setCommentsModalVisible(true);
  };

  const handleAddComment = () => {
    if (newComment.trim() && selectedPost) {
      setMyPosts(currentPosts =>
        currentPosts.map(post => {
          if (post.id === selectedPost.id) {
            return { ...post, comments: post.comments + 1 };
          }
          return post;
        })
      );
      setNewComment('');
    }
  };

  const getCommentsForPost = (postId) => {
    return mockMyRecipesComments[postId] || [];
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.screenBackground, paddingTop: insets.top }]}>
      {/* Header with Back Button and Title */}
      <View style={[styles.header, { backgroundColor: theme.screenBackground }]}>
        <Pressable 
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed
          ]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={fp(24)} color="rgba(255, 255, 255, 0.85)" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Recipes</Text>
        <View style={{ width: fp(24) }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {myPosts.length > 0 ? (
          myPosts.map((post) => (
          <Pressable
            key={post.id}
            style={({ pressed }) => [
              styles.postCard,
              { backgroundColor: theme.postCardBackground },
              pressed && styles.postCardPressed,
            ]}
            onPress={() => {
              setSelectedDish(post);
              setDishDetailModalVisible(true);
            }}
          >
            {/* Image placeholder */}
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.imageBackground }]}>
              <Text style={{ color: theme.textTertiary, fontWeight: '600' }}>IMAGE</Text>
            </View>

            {/* Content */}
            <View style={styles.postContent}>
              <View style={styles.titleRow}>
                <Text style={[styles.postTitle, { color: theme.textPrimary }]}>{post.title}</Text>
                <Ionicons name="ellipsis-horizontal" size={fp(18)} color={theme.textSecondary} />
              </View>

              <Text style={[styles.postDescription, { color: theme.textSecondary }]}>
                {post.description}
              </Text>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.statButton,
                    pressed && styles.statButtonPressed,
                  ]}
                  onPress={() => handleLike(post.id)}
                >
                  <Ionicons
                    name={post.liked ? 'heart' : 'heart-outline'}
                    size={fp(16)}
                    color={post.liked ? theme.likeColor : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.statText,
                      { color: theme.textSecondary },
                      post.liked && { color: theme.likeColor },
                    ]}
                  >
                    {post.likes}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.statButton,
                    pressed && styles.statButtonPressed,
                  ]}
                  onPress={() => handleComment(post)}
                >
                  <Ionicons name="chatbubble-outline" size={fp(15)} color={theme.textSecondary} />
                  <Text style={[styles.statText, { color: theme.textSecondary }]}>{post.comments}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.statButton,
                    pressed && styles.statButtonPressed,
                  ]}
                  onPress={() => handleSave(post.id)}
                >
                  <Ionicons
                    name={post.saved ? 'bookmark' : 'bookmark-outline'}
                    size={fp(16)}
                    color={post.saved ? theme.saveColor : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.statText,
                      { color: theme.textSecondary },
                      post.saved && { color: theme.saveColor },
                    ]}
                  >
                    {post.saves}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        ))
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.inputBackground }]}>
              <Ionicons name="restaurant-outline" size={fp(48)} color={theme.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No recipes yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Create your first recipe and share it with the community!
            </Text>
            <Pressable 
              style={({ pressed }) => [
                styles.createButton,
                { backgroundColor: theme.primary },
                pressed && styles.createButtonPressed
              ]}
              onPress={() => navigation.navigate('Home')}
            >
              <Ionicons name="add" size={fp(20)} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create Recipe</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Comments Modal */}
      <Modal
        visible={commentsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCommentsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCommentsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%' }}
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                  <View style={[styles.modalHeader, { borderBottomColor: theme.border, alignItems: 'center' }]}>
                    <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Comments</Text>
                    <Pressable
                      onPress={() => setCommentsModalVisible(false)}
                      style={{ paddingVertical: hp(4), paddingLeft: wp(12) }}
                    >
                      <Text style={{ color: theme.primary, fontWeight: '600', fontSize: fp(15) }}>Close</Text>
                    </Pressable>
                  </View>

                  <ScrollView style={{ maxHeight: hp(300), padding: wp(20) }}>
                    {selectedPost && getCommentsForPost(selectedPost.id).map((comment) => (
                      <View key={comment.id} style={{ marginBottom: hp(15), flexDirection: 'row', gap: wp(10) }}>
                        <View style={{ width: wp(30), height: wp(30), borderRadius: wp(15), backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#FFFFFF', fontSize: fp(10), fontWeight: '700' }}>{comment.initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: fp(13) }}>{comment.author}</Text>
                            <Text style={{ color: theme.textTertiary, fontSize: fp(11) }}>{comment.timestamp}</Text>
                          </View>
                          <Text style={{ color: theme.textSecondary, fontSize: fp(13), marginTop: hp(2) }}>{comment.text}</Text>
                        </View>
                      </View>
                    ))}

                    {selectedPost && getCommentsForPost(selectedPost.id).length === 0 && (
                      <View style={{ alignItems: 'center', paddingVertical: hp(40) }}>
                        <Ionicons name="chatbubble-outline" size={fp(38)} color={theme.textTertiary} />
                        <Text style={{ color: theme.textSecondary, fontSize: fp(16), marginTop: hp(12) }}>No comments yet</Text>
                        <Text style={{ color: theme.textTertiary, fontSize: fp(13), marginTop: hp(4) }}>Be the first to comment!</Text>
                      </View>
                    )}
                  </ScrollView>

                  <View style={[styles.addCommentContainer, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
                    <TextInput
                      style={[styles.commentInput, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
                      placeholder="Write a comment..."
                      placeholderTextColor={theme.textTertiary}
                      value={newComment}
                      onChangeText={setNewComment}
                    />
                    <Pressable
                      onPress={handleAddComment}
                      style={{ padding: wp(8), backgroundColor: theme.primary, borderRadius: wp(20) }}
                    >
                      <Ionicons name="send" size={fp(16)} color="white" />
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Dish Detail Modal */}
      <DishDetailModal
        visible={dishDetailModalVisible}
        dish={selectedDish}
        showChefReviewButton={true}
        onClose={() => {
          setDishDetailModalVisible(false);
          setSelectedDish(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: hp(12),
  },
  backButton: {
    padding: wp(8),
    borderRadius: wp(8),
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: fp(20),
    fontWeight: '700',
  },
  content: {
    padding: SPACING.screenPadding,
    paddingBottom: hp(40),
  },
  postCard: {
    borderRadius: wp(16),
    marginBottom: SPACING.itemGap,
    overflow: 'hidden',
    elevation: 3,
  },
  postCardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  imagePlaceholder: {
    height: hp(200),
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContent: {
    padding: wp(16),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTitle: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  postDescription: {
    marginTop: hp(6),
    fontSize: fp(14),
    lineHeight: hp(20),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: hp(16),
    paddingTop: hp(12),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    padding: wp(8),
  },
  statButtonPressed: {
    opacity: 0.6,
  },
  statText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: wp(24),
    borderTopRightRadius: wp(24),
    paddingTop: hp(20),
    paddingBottom: hp(30),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(20),
    paddingBottom: hp(16),
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(20),
    paddingTop: hp(16),
    borderTopWidth: 1,
    gap: wp(12),
  },
  commentInput: {
    flex: 1,
    borderRadius: wp(20),
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    fontSize: fp(14),
    maxHeight: hp(80),
  },
  // Empty State Styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(80),
    paddingHorizontal: wp(40),
  },
  emptyIconContainer: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(24),
  },
  emptyTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    marginBottom: hp(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fp(14),
    textAlign: 'center',
    lineHeight: hp(20),
    marginBottom: hp(24),
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(12),
    paddingHorizontal: wp(24),
    borderRadius: wp(12),
    gap: wp(8),
  },
  createButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: fp(16),
    fontWeight: '600',
  },
});
