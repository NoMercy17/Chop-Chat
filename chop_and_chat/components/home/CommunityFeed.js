import { useState, useMemo, useContext } from 'react';
import { Text, View, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { usePosts } from '../../context/PostsContext';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import DishDetailModal from '../posts/DishDetailModal';
import CommentsModal from '../posts/CommentsModal';

export default function CommunityFeed() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { token } = useContext(AuthContext);
    const { posts: allPosts, handleLike, handleSave, addComment } = usePosts();

    // Show only the 2 most recent posts in the home screen feed
    const posts = useMemo(() => allPosts.slice(0, 2), [allPosts]);

    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const [newComment, setNewComment] = useState('');

    const handleComment = async (post) => {
        setSelectedPost(post);
        setComments([]);
        setCommentsLoading(true);
        setCommentsModalVisible(true);
        try {
            const data = await api.get(`/posts/${post.id}/comments`, token);
            setComments(data?.comments || []);
        } catch (error) {
            console.error('[CommunityFeed] fetchComments:', error.message);
        } finally {
            setCommentsLoading(false);
        }
    };

    const handleAddComment = async () => {
        const text = newComment.trim();
        if (!text || !selectedPost) return;
        setNewComment('');
        const comment = await addComment(selectedPost.id, text);
        if (comment) setComments(curr => [...curr, comment]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Community Feed</Text>
                <Pressable 
                   style={({ pressed }) => [
                       styles.subtitleButton,
                       pressed && styles.subtitleButtonPressed
                   ]}
                    onPress={() => navigation.navigate('AllCommunityPosts')}
                    >
                    <View style = {styles.subtitleContent}>
                        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>See what others are cooking</Text>
                        <Ionicons name="arrow-forward" size={fp(14)} color={theme.textSecondary} />
                    </View>
                </Pressable>  
            </View>

            <ScrollView 
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {posts.length > 0 ? posts.map((post) => (
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
                            <Image source={{ uri: post.image }} style={styles.dishImage} />
                        ) : (
                            <View style={[styles.dishImagePlaceholder, { backgroundColor: theme.imageBackground }]}>
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
                                    <Pressable 
                                        style={({ pressed }) => [
                                            styles.statButton,
                                            pressed && styles.statButtonPressed
                                        ]}
                                        onPress={() => handleLike(post.id)}
                                    >
                                        <Ionicons 
                                            name={post.liked ? "heart" : "heart-outline"} 
                                            size={fp(16)} 
                                            color={post.liked ? theme.likeColor : theme.textSecondary} 
                                        />
                                        <Text style={[styles.statText, { color: theme.textSecondary }, post.liked && { color: theme.likeColor }]}>
                                            {post.likes}
                                        </Text>
                                    </Pressable>

                                    <Pressable 
                                        style={({ pressed }) => [
                                            styles.statButton,
                                            pressed && styles.statButtonPressed
                                        ]}
                                        onPress={() => handleComment(post)}
                                    >
                                        <Ionicons name="chatbubble-outline" size={fp(15)} color={theme.textSecondary} />
                                        <Text style={[styles.statText, { color: theme.textSecondary }]}>{post.comments}</Text>
                                    </Pressable>
                                    
                                    <Pressable 
                                        style={({ pressed }) => [
                                            styles.statButton,
                                            pressed && styles.statButtonPressed
                                        ]}
                                        onPress={() => handleSave(post.id)}
                                    >
                                        <Ionicons 
                                            name={post.saved ? "bookmark" : "bookmark-outline"} 
                                            size={fp(16)} 
                                            color={post.saved ? theme.saveColor : theme.textSecondary} 
                                        />
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Pressable>
                )) : (
                    <View style={{alignItems: 'center', paddingVertical: hp(20)}}>
                        <Text style={{ color: theme.textTertiary }}>No recent posts</Text>
                    </View>
                )}
                
                {/* More Button */}
                <Pressable 
                    style={({ pressed }) => [
                        styles.moreCard,
                        pressed && styles.moreCardPressed
                    ]}
                    onPress={() => navigation.navigate('AllCommunityPosts')}
                >
                    <View style={[styles.glassBackground, { backgroundColor: theme.primary }]}>
                        <View style={styles.moreCardContent}>
                            <Text style={styles.moreCardText}>More</Text>
                        </View>
                    </View>
                </Pressable>

            </ScrollView>

            <CommentsModal
                visible={commentsModalVisible}
                onClose={() => { setCommentsModalVisible(false); setSelectedPost(null); setComments([]); setNewComment(''); }}
                comments={comments}
                loading={commentsLoading}
                newComment={newComment}
                onCommentChange={setNewComment}
                onAddComment={handleAddComment}
                onAuthorPress={(comment) => {
                    setCommentsModalVisible(false);
                    navigation.navigate('OtherUserProfile', { userId: comment.authorId, userName: comment.author });
                }}
                theme={theme}
            />

            <DishDetailModal
                visible={dishDetailModalVisible}
                onClose={() => {
                    setDishDetailModalVisible(false);
                    setSelectedDish(null);
                }}
                dish={selectedDish}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: SPACING.sectionGap,
    },
    header: {
        paddingHorizontal: SPACING.screenPadding,
        marginBottom: SPACING.itemGap,
    },
    sectionTitle: {
        fontSize: fp(22),
        fontWeight: '700',
        marginBottom: hp(4),
        letterSpacing: -0.5,
    },
    subtitleButton: {
        alignSelf: 'flex-start',
    },
    subtitleButtonPressed: {
        opacity: 0.7,
    },
    subtitleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
    },
    sectionSubtitle: {
        fontSize: fp(14),
        fontWeight: '500',
        fontStyle: 'italic',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.screenPadding,
        paddingBottom: hp(32),
    },
    postCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: SPACING.radiusLarge,
        marginBottom: SPACING.itemGap,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(2) },
        shadowOpacity: 0.08,
        shadowRadius: wp(12),
        elevation: 3,
    },
    postCardPressed: {
        opacity: 0.95,
        transform: [{ scale: 0.99 }],
    },
    dishImage: {
        width: '100%',
        height: hp(140),
        resizeMode: 'cover',
    },
    dishImagePlaceholder: {
        width: '100%',
        height: hp(140),
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: fp(14),
        fontWeight: '600',
        color: '#9CA3AF',
        letterSpacing: 2,
    },
    postContent: {
        padding: wp(14),
        gap: hp(4),
    },
    postTitle: {
        fontSize: fp(18),
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.3,
    },
    postDescription: {
        fontSize: fp(14),
        color: '#6B7280',
        lineHeight: hp(18),
    },
    postMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: hp(4),
        paddingTop: hp(6),
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    postAuthor: {
        fontSize: fp(13),
        color: '#9CA3AF',
        fontWeight: '500',
    },
    postStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(16),
    },
    statButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(4),
    },
    statButtonPressed: {
        opacity: 0.6,
    },
    statText: {
        fontSize: fp(13),
        color: '#6B7280',
        fontWeight: '600',
    },
    moreCard: {
        alignSelf: 'center',
        width: wp(110),
        marginTop: hp(8),
        marginBottom: hp(16),
        overflow: 'hidden',
        borderRadius: wp(25),
    },
    moreCardPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.96 }],
    },
    glassBackground: {
        borderRadius: wp(25),
    },
    moreCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(12),
        paddingHorizontal: wp(24),
    },
    moreCardText: {
        fontSize: fp(14),
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
});
