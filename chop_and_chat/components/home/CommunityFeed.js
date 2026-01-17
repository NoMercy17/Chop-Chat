import { useState, useMemo } from 'react';
import { Text, View, StyleSheet, ScrollView, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { usePosts } from '../../context/PostsContext';
import { commentsData } from '../../data/postsData';
import DishDetailModal from '../posts/DishDetailModal';

// Helper function to randomly select n post IDs
const getRandomPostIds = (posts, count) => {
    const shuffled = [...posts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(post => post.id);
};

export default function CommunityFeed() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { posts: allPosts, handleLike, handleSave, updateCommentCount } = usePosts();
    
    // Generate 7 random post IDs on component mount
    const randomPostIds = useMemo(() => getRandomPostIds(allPosts, 7), []);
    
    // Get the actual posts from context based on random IDs
    const posts = allPosts.filter(post => randomPostIds.includes(post.id));
    
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const [newComment, setNewComment] = useState('');

    const handleComment = (post) => {
        // Set the selected post and open the modal
        setSelectedPost(post);
        setCommentsModalVisible(true);
    };

    const handleAddComment = () => {
        if (newComment.trim() && selectedPost) {
            // send this to your backend
            console.log('New comment for post', selectedPost.id, ':', newComment);
            // Update the comment count using context
            updateCommentCount(selectedPost.id);
            setNewComment('');
        }
    };

    const getCommentsForPost = (postId) => {
        return commentsData[postId] || [];
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
                {posts.map((post) => (
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
                        <View style={[styles.dishImagePlaceholder, { backgroundColor: theme.imageBackground }]}>
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
                ))}
                
                {/* More Button */}
                <Pressable 
                    style={({ pressed }) => [
                        styles.moreCard,
                        pressed && styles.moreCardPressed
                    ]}
                    onPress={() => navigation.navigate('AllCommunityPosts')}
                >
                    <View style={styles.glassBackground}>
                        <View style={styles.moreCardContent}>
                            <Text style={styles.moreCardText}>More</Text>
                        </View>
                    </View>
                </Pressable>

            </ScrollView>

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
                            style={{ width: '100%' }}
                        >
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                                        <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Comments</Text>
                                        <Pressable onPress={() => {
                                            setCommentsModalVisible(false);
                                            setSelectedPost(null);
                                            setNewComment('');
                                        }}>
                                            <Text style={{color: theme.primary, fontWeight:'600'}}>Close</Text>
                                        </Pressable>
                                    </View>
                                    
                                    <ScrollView 
                                        style={{maxHeight: hp(300), padding: wp(20)}}
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {selectedPost && getCommentsForPost(selectedPost.id).map((comment) => (
                                            <View key={comment.id} style={{marginBottom: hp(15), flexDirection:'row', gap: wp(10)}}>
                                                <View style={{width: wp(30), height: wp(30), borderRadius: wp(15), backgroundColor: theme.primary, alignItems:'center', justifyContent:'center'}}>
                                                    <Text style={{color: '#FFFFFF', fontSize: fp(10), fontWeight:'700'}}>{comment.initials}</Text>
                                                </View>
                                                <View style={{flex: 1}}>
                                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                                        <Text style={{color: theme.textPrimary, fontWeight:'600', fontSize: fp(13)}}>{comment.author}</Text>
                                                        <Text style={{color: theme.textTertiary, fontSize: fp(11)}}>{comment.timestamp}</Text>
                                                    </View>
                                                    <Text style={{color: theme.textSecondary, fontSize: fp(13), marginTop: hp(2)}}>{comment.text}</Text>
                                                </View>
                                            </View>
                                        ))}
                                        
                                        {/* Empty state when no comments */}
                                        {selectedPost && getCommentsForPost(selectedPost.id).length === 0 && (
                                            <View style={{alignItems: 'center', paddingVertical: hp(40)}}>
                                                <Ionicons name="chatbubble-outline" size={fp(38)} color={theme.textTertiary} />
                                                <Text style={{color: theme.textSecondary, fontSize: fp(16), marginTop: hp(12)}}>No comments yet</Text>
                                                <Text style={{color: theme.textTertiary, fontSize: fp(13), marginTop: hp(4)}}>Be the first to comment!</Text>
                                            </View>
                                        )}
                                    </ScrollView>

                                    {/* Add new comment */}
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
                                            style={{padding: wp(8), backgroundColor: theme.primary, borderRadius: wp(20)}}
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
    statTextLiked: {
        color: "#b90808ff",
    },
    moreCard: {
        alignSelf: 'center',
        width: wp(110),
        marginTop: hp(8),
        marginBottom: hp(16),
        overflow: 'hidden',
    },
    moreCardPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.96 }],
    },
    glassBackground: {
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.35)',
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