import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { wp, hp, fp, SPACING } from '../utils/responsive';
import { commentsData } from '../data/postsData';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { usePosts } from '../context/PostsContext';


const CATEGORIES = ['Following', 'All'];

// Sample list of followed user IDs - in a real app this would come from your backend/context
const FOLLOWED_AUTHORS = ['John Doe', 'Jane Smith', 'Emily Carter', 'Carlos Rivera'];

export default function AllCommunityPosts({ navigation }) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { posts, handleLike, handleSave, updateCommentCount } = usePosts();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [newComment, setNewComment] = useState('');
    
    // Filter posts based on selected category
    const filteredPosts = selectedCategory === 'All' 
        ? posts 
        : posts.filter(post => FOLLOWED_AUTHORS.includes(post.author));
    
    const handleComment = (post) => {
        setSelectedPost(post);
        setCommentsModalVisible(true);
    };

    const handleAddComment = () => {
        if (newComment.trim() && selectedPost) {
            console.log('New comment for post', selectedPost.id, ':', newComment);
            updateCommentCount(selectedPost.id);
            setNewComment('');
        }
    };

    const getCommentsForPost = (postId) => {
        return commentsData[postId] || [];
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.screenBackground, paddingTop: insets.top }]}>
            {/* Category Tabs with Back Button */}
            <View style={[styles.categoryWrapper, { backgroundColor: theme.screenBackground }]}>
                <Pressable 
                    style={({ pressed }) => [
                        styles.backButton,
                        pressed && styles.backButtonPressed
                    ]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={fp(24)} color="rgba(255, 255, 255, 0.85)" />
                </Pressable>
                <View style={styles.categoryContainer}>
                    {CATEGORIES.map((category) => (
                        <Pressable
                            key={category}
                            style={({ pressed }) => [
                                styles.categoryTab,
                                selectedCategory === category && styles.categoryTabActive,
                                pressed && styles.categoryTabPressed
                            ]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === category && styles.categoryTextActive
                            ]}>
                                {category}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
                {filteredPosts.length > 0 ? filteredPosts.map((post) => (
                <Pressable
                    key={post.id}
                    style={({ pressed }) => [
                        styles.postCard,
                        { backgroundColor: theme.postCardBackground },
                        pressed && styles.postCardPressed
                    ]}
                    onPress={() => console.log('Post pressed:', post.id)}
                >
                    <View style={[styles.imageplaceholder, { backgroundColor: theme.imageBackground }]}>
                        <Text style={[styles.imagePlaceholderText, { color: theme.textTertiary }]}>IMAGE</Text>
                    </View>
                    
                    <View style={[styles.postContent, { backgroundColor: theme.postContentBackground }]}>
                        <Text style={[styles.postTitle, { color: theme.textPrimary }]}>{post.title}</Text>
                        <Text style={[styles.postDescription, { color: theme.textPrimary }]}>{post.description}</Text>
                        
                        <View style={[styles.postMeta, { backgroundColor: theme.postContentBackground }]}>
                            <Text style={[styles.postAuthor, { color: theme.textSecondary }]}>by {post.author}</Text>
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
                <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={fp(48)} color={theme.textTertiary} />
                    <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>No posts from followed users</Text>
                    <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>Follow some chefs to see their posts here!</Text>
                </View>
            )}

            {/* Comments Modal */}
            <Modal 
                visible={commentsModalVisible} 
                transparent={true} 
                animationType="slide"
                onRequestClose={() => setCommentsModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => {
                    setCommentsModalVisible(false);
                    setSelectedPost(null);
                    setNewComment('');
                }}>
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView 
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                            style={styles.modalKeyboardView}
                        >
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                        <View style={[styles.modalHeader, { backgroundColor: theme.headerBackground }]}>
                            <Text style={[styles.modalTitle, { color: '#FFFFFF' }]}>Comments</Text>
                            <Text style={[styles.modalSubtitle, { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>
                                {selectedPost?.title}
                            </Text>
                        </View>
                        
                        <ScrollView 
                            style={[styles.commentsList, { backgroundColor: theme.commentSectionBg }]}
                            showsVerticalScrollIndicator={false}
                        >
                            {selectedPost && getCommentsForPost(selectedPost.id).map((comment) => (
                                <View key={comment.id} style={[styles.commentItem, { backgroundColor: theme.cardBackgroundAlt }]}>
                                    <View style={[styles.commentAvatar, { backgroundColor: theme.primary }]}>
                                        <Text style={styles.commentAvatarText}>{comment.initials}</Text>
                                    </View>
                                    
                                    <View style={styles.commentContent}>
                                        <View style={styles.commentHeader}>
                                            <Text style={[styles.commentAuthor, { color: theme.textPrimary }]}>{comment.author}</Text>
                                            <Text style={[styles.commentTime, { color: theme.textTertiary }]}>{comment.timestamp}</Text>
                                        </View>
                                        <Text style={[styles.commentText, { color: theme.textSecondary }]}>{comment.text}</Text>
                                    </View>
                                </View>
                            ))}
                            
                            {selectedPost && getCommentsForPost(selectedPost.id).length === 0 && (
                                <View style={styles.emptyComments}>
                                    <Ionicons name="chatbubble-outline" size={fp(38)} color={theme.textTertiary} />
                                    <Text style={[styles.emptyCommentsText, { color: theme.textSecondary }]}>No comments yet</Text>
                                    <Text style={[styles.emptyCommentsSubtext, { color: theme.textTertiary }]}>Be the first to comment!</Text>
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
                                multiline
                            />
                            <Pressable 
                                style={({ pressed }) => [
                                    styles.sendButton,
                                    { backgroundColor: theme.primary },
                                    pressed && styles.sendButtonPressed,
                                    !newComment.trim() && styles.sendButtonDisabled
                                ]}
                                onPress={handleAddComment}
                                disabled={!newComment.trim()}
                            >
                                <Ionicons 
                                    name="send" 
                                    size={fp(20)} 
                                    color={newComment.trim() ? "#FFFFFF" : theme.textTertiary} 
                                />
                            </Pressable>
                        </View>

                        <Pressable 
                            onPress={() => {
                                setCommentsModalVisible(false);
                                setSelectedPost(null);
                                setNewComment('');
                            }} 
                            style={({ pressed }) => [
                                styles.closeButton,
                                { backgroundColor: theme.border },
                                pressed && styles.closeButtonPressed
                            ]}
                        >
                            <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>Close</Text>
                        </Pressable>
                                </View>
                            </TouchableWithoutFeedback>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#93C5FD',
    },
    
    // Category Tabs
    categoryWrapper: {
        backgroundColor: '#93C5FD',
        paddingTop: hp(8),
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: wp(40),
        height: wp(40),
        borderRadius: wp(20),
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: wp(12),
    },
    backButtonPressed: {
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    categoryContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.screenPadding,
        gap: wp(40),
    },
    categoryTab: {
        paddingVertical: hp(12),
        paddingHorizontal: wp(8),
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    categoryTabActive: {
        borderBottomColor: '#c7e1f1ff',
    },
    categoryTabPressed: {
        opacity: 0.7,
    },
    categoryText: {
        fontSize: fp(16),
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    categoryTextActive: {
        color: '#FFFFFF',
    },
    
    scrollContainer: {
        flex: 1,
    },
    content: {
        padding: SPACING.screenPadding,
        paddingBottom: hp(32),
    },
    
    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(80),
        paddingHorizontal: SPACING.screenPadding,
    },
    emptyStateTitle: {
        fontSize: fp(18),
        fontWeight: '600',
        color: '#374151',
        marginTop: hp(16),
        textAlign: 'center',
    },
    emptyStateSubtitle: {
        fontSize: fp(14),
        color: '#6B7280',
        marginTop: hp(8),
        textAlign: 'center',
    },
    
    postCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: wp(16),
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
    imageplaceholder: {
        width: '100%',
        height: hp(200),
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
        padding: wp(16),
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
        lineHeight: hp(20),
        marginTop: hp(6),
    },
    postMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: hp(12),
        paddingTop: hp(12),
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
    statTextLiked: {
        color: '#b90808ff',
    },
    
    // Modal Styles 
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalKeyboardView: {
        width: '100%',
    },
    modalContainer: {
        backgroundColor: '#F8FAFB',
        borderTopLeftRadius: wp(24),
        borderTopRightRadius: wp(24),
        paddingTop: hp(20),
        paddingBottom: hp(30),
        maxHeight: hp(600),
    },
    modalHeader: {
        paddingHorizontal: wp(20),
        paddingBottom: hp(16),
        borderBottomWidth: 1,
        borderBottomColor: '#d8d9dbf8',
    },
    modalTitle: {
        fontSize: fp(20),
        fontWeight: '700',
        color: '#111827',
        marginBottom: hp(4),
    },
    modalSubtitle: {
        fontSize: fp(14),
        color: '#6B7280',
    },
    commentsList: {
        maxHeight: hp(350),
        paddingHorizontal: wp(20),
    },
    commentItem: {
        flexDirection: 'row',
        paddingVertical: hp(14),
        borderBottomWidth: 1,
        borderBottomColor: '#d8d9dbf8',
    },
    commentAvatar: {
        width: wp(40),
        height: wp(40),
        borderRadius: wp(20),
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(12),
    },
    commentAvatarText: {
        fontSize: fp(14),
        fontWeight: '600',
        color: '#0284C7',
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(4),
    },
    commentAuthor: {
        fontSize: fp(14),
        fontWeight: '600',
        color: '#111827',
    },
    commentTime: {
        fontSize: fp(12),
        color: '#9CA3AF',
    },
    commentText: {
        fontSize: fp(14),
        color: '#374151',
        lineHeight: hp(20),
    },
    emptyComments: {
        alignItems: 'center',
        paddingVertical: hp(40),
    },
    emptyCommentsText: {
        fontSize: fp(16),
        fontWeight: '600',
        color: '#6B7280',
        marginTop: hp(12),
    },
    emptyCommentsSubtext: {
        fontSize: fp(14),
        color: '#9CA3AF',
        marginTop: hp(4),
    },
    addCommentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(20),
        paddingTop: hp(16),
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: wp(12),
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: wp(20),
        paddingHorizontal: wp(16),
        paddingVertical: hp(10),
        fontSize: fp(14),
        color: '#111827',
        maxHeight: hp(80),
    },
    sendButton: {
        width: wp(44),
        height: wp(44),
        borderRadius: wp(22),
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.95 }],
    },
    sendButtonDisabled: {
        backgroundColor: '#E5E7EB',
    },
    closeButton: {
        marginTop: hp(16),
        marginHorizontal: wp(20),
        paddingVertical: hp(14),
        backgroundColor: '#F3F4F6',
        borderRadius: wp(12),
        alignItems: 'center',
    },
    closeButtonPressed: {
        backgroundColor: '#E5E7EB',
    },
    closeButtonText: {
        fontSize: fp(16),
        fontWeight: '600',
        color: '#374151',
    },
});
