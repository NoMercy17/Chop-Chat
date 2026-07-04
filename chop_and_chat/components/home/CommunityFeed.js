import { useState, useMemo, useContext } from 'react';
import { Text, View, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { usePosts } from '../../context/PostsContext';
import { AuthContext } from '../../context/AuthContext';
import { navigateToProfile } from '../../utils/navigation';
import { api } from '../../services/api';
import DishDetailModal from '../posts/DishDetailModal';
import CommentsModal from '../posts/CommentsModal';

export default function CommunityFeed() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { token, user } = useContext(AuthContext);
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
    const [commentError, setCommentError] = useState(null);

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

        const tempId = `temp-${Date.now()}`;
        setComments(curr => [...curr, {
            id: tempId, authorId: user?.id,
            author: user?.name || 'You',
            initials: (user?.name || 'YO').substring(0, 2).toUpperCase(),
            text, timestamp: 'just now',
        }]);
        setNewComment('');

        const result = await addComment(selectedPost.id, text);
        if (result?.blocked) {
            setComments(curr => curr.filter(c => c.id !== tempId));
            setNewComment(text);
            setCommentError(result.message);
        } else if (result) {
            setComments(curr => curr.map(c => c.id === tempId ? result : c));
            setCommentError(null);
        } else {
            setComments(curr => curr.filter(c => c.id !== tempId));
            setNewComment(text);
        }
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
                            <Text style={[styles.postDescription, { color: theme.textSecondary }]}>{post.description}</Text>

                            <View style={[styles.postMeta, { backgroundColor: theme.postMetaBackground, borderTopColor: theme.borderLight }]}>
                                <Pressable
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        navigateToProfile(navigation, post.authorId || post.id, post.author, user?.id, post.authorPhoto);
                                    }}
                                    style={({ pressed }) => [styles.authorRow, pressed && { opacity: 0.7 }]}
                                >
                                    {post.authorPhoto ? (
                                        <Image source={{ uri: post.authorPhoto }} style={styles.authorAvatar} />
                                    ) : (
                                        <View style={[styles.authorAvatarPlaceholder, { backgroundColor: theme.primary }]}>
                                            <Text style={[styles.authorInitial, { color: theme.textInverse }]}>
                                                {post.author ? post.author[0].toUpperCase() : '?'}
                                            </Text>
                                        </View>
                                    )}
                                    <Text style={[styles.postAuthor, { color: theme.primary }]}>{post.author}</Text>
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
                            <Text style={[styles.moreCardText, { color: theme.textInverse }]}>More</Text>
                        </View>
                    </View>
                </Pressable>

            </ScrollView>

            <CommentsModal
                visible={commentsModalVisible}
                onClose={() => { setCommentsModalVisible(false); setSelectedPost(null); setComments([]); setNewComment(''); setCommentError(null); }}
                comments={comments}
                loading={commentsLoading}
                newComment={newComment}
                onCommentChange={(t) => { setNewComment(t); setCommentError(null); }}
                onAddComment={handleAddComment}
                errorMessage={commentError}
                onAuthorPress={(comment) => {
                    setCommentsModalVisible(false);
                    navigateToProfile(navigation, comment.authorId, comment.author, user?.id);
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
        opacity: 0.92,
        transform: [{ scale: 0.97 }],
    },
    dishImage: {
        width: '100%',
        height: hp(180),
        resizeMode: 'cover',
    },
    dishImagePlaceholder: {
        width: '100%',
        height: hp(180),
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: fp(14),
        fontWeight: '600',
        letterSpacing: 2,
    },
    postContent: {
        padding: wp(14),
        gap: hp(4),
    },
    postTitle: {
        fontSize: fp(18),
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    postDescription: {
        fontSize: fp(14),
        lineHeight: hp(18),
    },
    postMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: hp(4),
        paddingTop: hp(6),
        borderTopWidth: 1,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(6),
    },
    authorAvatar: {
        width: wp(24),
        height: wp(24),
        borderRadius: wp(12),
    },
    authorAvatarPlaceholder: {
        width: wp(24),
        height: wp(24),
        borderRadius: wp(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorInitial: {
        fontSize: fp(11),
        fontWeight: '700',
    },
    postAuthor: {
        fontSize: fp(13),
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
        transform: [{ scale: 0.85 }],
    },
    statText: {
        fontSize: fp(13),
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
        letterSpacing: 0.3,
    },
});
