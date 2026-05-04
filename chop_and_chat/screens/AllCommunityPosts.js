import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { wp, hp, fp } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { usePosts } from '../context/PostsContext';
import DishDetailModal from '../components/posts/DishDetailModal';
import CategoryHeader from '../components/home/CategoryHeader';
import CommentsModal from '../components/posts/CommentsModal';

const CATEGORIES = ['Following', 'All'];

export default function AllCommunityPosts({ navigation }) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { posts, handleLike, handleSave, updateCommentCount } = usePosts();
    
    // State
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const [newComment, setNewComment] = useState('');
    
    const filteredPosts = selectedCategory === 'All' 
        ? posts 
        : posts.filter(post => false); // TODO: Implement real following filter
    
    const handleComment = (post) => {
        setSelectedPost(post);
        setCommentsModalVisible(true);
    };

    const handleAddComment = () => {
        if (newComment.trim() && selectedPost) {
            updateCommentCount(selectedPost.id);
            setNewComment('');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.screenBackground, paddingTop: insets.top }]}>
            <CategoryHeader 
                categories={CATEGORIES}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onBack={() => navigation.goBack()}
                theme={theme}
            />

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
                {filteredPosts.length > 0 ? filteredPosts.map((post) => (
                <Pressable
                    key={post.id}
                    style={({ pressed }) => [
                        styles.postCard,
                        { backgroundColor: theme.postCardBackground },
                        pressed && styles.postCardPressed
                    ]}
                    onPress={() => {
                        setSelectedDish(post);
                        setDishDetailModalVisible(true);
                    }}
                >
                    {post.image ? (
                        <Image source={{ uri: post.image }} style={styles.postImage} />
                    ) : (
                        <View style={[styles.imageplaceholder, { backgroundColor: theme.imageBackground }]}>
                            <Text style={[styles.imagePlaceholderText, { color: theme.textTertiary }]}>IMAGE</Text>
                        </View>
                    )}
                    
                    <View style={[styles.postContent, { backgroundColor: theme.postContentBackground }]}>
                        <Text style={[styles.postTitle, { color: theme.textPrimary }]}>{post.title}</Text>
                        <Text style={[styles.postDescription, { color: theme.textPrimary }]}>{post.description}</Text>
                        
                        <View style={[styles.postMeta, { backgroundColor: theme.postMetaBackground }]}>
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation();
                                    navigation.navigate('OtherUserProfile', {
                                        userId: post.authorId || post.id,
                                        userName: post.author
                                    });
                                }}
                                style={({pressed}) => pressed && {opacity: 0.7}}
                            >
                                <Text style={[styles.postAuthor, { color: theme.primary }]}>by {post.author}</Text>
                            </Pressable>
                                <View style={styles.postStats}>
                                    <Pressable style={styles.statButton} onPress={() => handleLike(post.id)}>
                                        <Ionicons name={post.liked ? "heart" : "heart-outline"} size={fp(16)} color={post.liked ? theme.likeColor : theme.textSecondary} />
                                        <Text style={[styles.statText, { color: theme.textSecondary }, post.liked && { color: theme.likeColor }]}>{post.likes}</Text>
                                    </Pressable>
                        
                                    <Pressable style={styles.statButton} onPress={() => handleComment(post)}>
                                        <Ionicons name="chatbubble-outline" size={fp(15)} color={theme.textSecondary} />
                                        <Text style={[styles.statText, { color: theme.textSecondary }]}>{post.comments}</Text>
                                    </Pressable>
                                    
                                    <Pressable style={styles.statButton} onPress={() => handleSave(post.id)}>
                                        <Ionicons name={post.saved ? "bookmark" : "bookmark-outline"} size={fp(16)} color={post.saved ? theme.saveColor : theme.textSecondary} />
                                    </Pressable>
                                </View>
                        </View>
                    </View>
                </Pressable>
            )) : (
                <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={fp(48)} color={theme.textTertiary} />
                    <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>No posts from followed users</Text>
                    <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>Follow some chefs to see their posts here!</Text>
                </View>
            )}
            </ScrollView>

            <CommentsModal 
                visible={commentsModalVisible}
                onClose={() => setCommentsModalVisible(false)}
                comments={[]}
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
    scrollContainer: { flex: 1 },
    content: { padding: wp(16), paddingBottom: hp(40) },
    postCard: { borderRadius: wp(16), marginBottom: hp(20), overflow: 'hidden', elevation: 3 },
    postCardPressed: { opacity: 0.95 },
    postImage: { width: '100%', height: hp(200), resizeMode: 'cover' },
    imageplaceholder: { width: '100%', height: hp(200), justifyContent: 'center', alignItems: 'center' },
    imagePlaceholderText: { fontWeight: '700', fontSize: fp(14) },
    postContent: { padding: wp(16) },
    postTitle: { fontSize: fp(18), fontWeight: '700', marginBottom: hp(4) },
    postDescription: { fontSize: fp(14), marginBottom: hp(12), lineHeight: fp(20) },
    postMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: wp(10), borderRadius: wp(12) },
    postAuthor: { fontSize: fp(14), fontWeight: '600' },
    postStats: { flexDirection: 'row', gap: wp(12) },
    statButton: { flexDirection: 'row', alignItems: 'center', gap: wp(4) },
    statText: { fontSize: fp(13), fontWeight: '600' },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: hp(100), paddingHorizontal: wp(40) },
    emptyStateTitle: { fontSize: fp(18), fontWeight: '700', marginTop: hp(16) },
    emptyStateSubtitle: { fontSize: fp(14), textAlign: 'center', marginTop: hp(8) }
});
