import { useState } from 'react';
import { Text, View, StyleSheet, ScrollView, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';

// in a real app, this would come from your backend
const commentsData = {
    1: [
        { id: 1, author: "Maria Garcia", initials: "MG", text: "This looks absolutely delicious! Can you share the dough recipe?", timestamp: "2h ago" },
        { id: 2, author: "Tom Wilson", initials: "TW", text: "Made this last night, my family loved it!", timestamp: "5h ago" },
        { id: 3, author: "Sarah Kim", initials: "SK", text: "The crust looks perfect 👨‍🍳", timestamp: "1d ago" },
        { id: 4, author: "Sarah Kim", initials: "SK", text: "The crust looks perfect 👨‍🍳", timestamp: "1d ago" },
        { id: 5, author: "Sarah Kim", initials: "SK", text: "The crust looks perfect 👨‍🍳", timestamp: "1d ago" },
        { id: 6, author: "Sarah Kim", initials: "SK", text: "The crust looks perfect 👨‍🍳", timestamp: "1d ago" },
        { id: 7, author: "Sarah Kim", initials: "SK", text: "The crust looks perfect 👨‍🍳", timestamp: "1d ago" },

    ],
    2: [
        { id: 1, author: "Chef Marco", initials: "CM", text: "Traditional carbonara is the best! No cream, right?", timestamp: "1h ago" },
        { id: 2, author: "Lisa Brown", initials: "LB", text: "Your grandma is a treasure! 💕", timestamp: "3h ago" },
    ],
    3: [
        { id: 1, author: "Healthy Eats", initials: "HE", text: "What did you use instead of eggs?", timestamp: "30m ago" },
    ],
};

const initialPosts = [
    { id: 1, title: "Homemade Pizza Margherita", description: "Just made my first pizza from scratch! The dough came out perfect.", author: "John Doe", likes: 42, comments: 9, liked: false },
    { id: 2, title: "Grandma's Secret Pasta Recipe", description: "Finally convinced grandma to share her famous carbonara recipe.", author: "Jane Smith", likes: 127, comments: 23, liked: false },
    { id: 3, title: "Vegan Chocolate Cake", description: "Who said vegan desserts can't be delicious? This cake is amazing!", author: "Mike Johnson", likes: 89, comments: 15, liked: false },
    { id: 4, title: "Sunday Brunch Special", description: "Eggs benedict with hollandaise sauce - turned out better than expected.", author: "Sarah Lee", likes: 56, comments: 12, liked: false },
    { id: 5, title: "Thai Curry Adventure", description: "First time making green curry. The spice level is just right!", author: "Alex Brown", likes: 73, comments: 19, liked: false },
    { id: 6, title: "Sourdough Bread Success", description: "After days of feeding the starter, the crust and crumb finally nailed it.", author: "Emily Carter", likes: 94, comments: 21, liked: false },
    { id: 7, title: "Street-Style Tacos at Home", description: "Tried recreating authentic al pastor tacos with pineapple and cilantro.", author: "Carlos Rivera", likes: 118, comments: 27, liked: false },
    { id: 8, title: "Quick Weeknight Stir Fry", description: "15-minute veggie stir fry with garlic soy sauce. Simple and satisfying.", author: "Lina Wong", likes: 61, comments: 9, liked: false },
    { id: 9, title: "Classic French Omelette", description: "Focused on technique today—soft, buttery, and perfectly folded.", author: "Pierre Martin", likes: 85, comments: 14, liked: false },
    { id: 10, title: "Homemade Ice Cream Experiment", description: "No-churn vanilla ice cream with a salted caramel swirl.", author: "Olivia Green", likes: 102, comments: 18, liked: false },
];

export default function CommunityFeed() {
    const navigation = useNavigation();
    const [posts, setPosts] = useState(initialPosts);
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [newComment, setNewComment] = useState('');

    const handleLike = (postId) => {
        setPosts(posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    likes: post.liked ? post.likes - 1 : post.likes + 1,
                    liked: !post.liked
                };
            }
            return post;
        }));
    };

    const handleComment = (post) => {
        // Set the selected post and open the modal
        setSelectedPost(post);
        setCommentsModalVisible(true);
    };

    const handleAddComment = () => {
        if (newComment.trim() && selectedPost) {
            // send this to your backend
            console.log('New comment for post', selectedPost.id, ':', newComment);
            // Update the comment count locally
            setPosts(posts.map(post => {
                if (post.id === selectedPost.id) {
                    return { ...post, comments: post.comments + 1 };
                }
                return post;
            }));
            setNewComment('');
        }
    };

    const getCommentsForPost = (postId) => {
        return commentsData[postId] || [];
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Community Feed</Text>

                <Pressable 
                   style={({ pressed }) => [
                       styles.subtitleButton,
                       pressed && styles.subtitleButtonPressed
                   ]}
                    onPress={() => navigation.navigate('AllCommunityPosts')}
                    >
                    <View style = {styles.subtitleContent}>
                        <Text style={styles.sectionSubtitle}>See what others are cooking</Text>
                        <Ionicons name="arrow-forward" size={fp(14)} color="#E0F2FE" />
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
                            pressed && styles.postCardPressed
                        ]}
                        onPress={() => console.log('Post pressed:', post.id)}
                    >
                        <View style={styles.dishImagePlaceholder}>
                            <Text style={styles.imagePlaceholderText}>IMAGE</Text>
                        </View>

                        <View style={styles.postContent}>
                            <Text style={styles.postTitle}>{post.title}</Text>
                            <Text style={styles.postDescription}>{post.description}</Text>
                            
                            <View style={styles.postMeta}>
                                <Text style={styles.postAuthor}>by {post.author}</Text>
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
                                            color={post.liked ? "#b90808ff" : "#6B7280"} 
                                        />
                                        <Text style={[styles.statText, post.liked && styles.statTextLiked]}>
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
                                        <Ionicons name="chatbubble-outline" size={fp(15)} color="#6B7280" />
                                        <Text style={styles.statText}>{post.comments}</Text>
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
                <KeyboardAvoidingView 
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Comments</Text>
                            <Text style={styles.modalSubtitle} numberOfLines={1}>
                                {selectedPost?.title}
                            </Text>
                        </View>
                        
                        <ScrollView 
                            style={styles.commentsList}
                            showsVerticalScrollIndicator={false}
                        >
                            {selectedPost && getCommentsForPost(selectedPost.id).map((comment) => (
                                <View key={comment.id} style={styles.commentItem}>
                                    {/* initials */}
                                    <View style={styles.commentAvatar}>
                                        <Text style={styles.commentAvatarText}>{comment.initials}</Text>
                                    </View>
                                    
                                    {/* Comment */}
                                    <View style={styles.commentContent}>
                                        <View style={styles.commentHeader}>
                                            <Text style={styles.commentAuthor}>{comment.author}</Text>
                                            <Text style={styles.commentTime}>{comment.timestamp}</Text>
                                        </View>
                                        <Text style={styles.commentText}>{comment.text}</Text>
                                    </View>
                                </View>
                            ))}
                            
                            {/* Empty state when no comments */}
                            {selectedPost && getCommentsForPost(selectedPost.id).length === 0 && (
                                <View style={styles.emptyComments}>
                                    <Ionicons name="chatbubble-outline" size={fp(38)} color='#9CA3AF' />
                                    <Text style={styles.emptyCommentsText}>No comments yet</Text>
                                    <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Add new comment */}
                        <View style={styles.addCommentContainer}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Write a comment..."
                                placeholderTextColor="#9CA3AF"
                                value={newComment}
                                onChangeText={setNewComment}
                                multiline
                            />
                            <Pressable 
                                style={({ pressed }) => [
                                    styles.sendButton,
                                    pressed && styles.sendButtonPressed,
                                    !newComment.trim() && styles.sendButtonDisabled
                                ]}
                                onPress={handleAddComment}
                                disabled={!newComment.trim()}
                            >
                                <Ionicons 
                                    name="send" 
                                    size={fp(20)} 
                                    color={newComment.trim() ? "#FFFFFF" : "#9CA3AF"} 
                                />
                            </Pressable>
                        </View>

                        {/* Close Button */}
                        <Pressable 
                            onPress={() => {
                                setCommentsModalVisible(false);
                                setSelectedPost(null);
                                setNewComment('');
                            }} 
                            style={({ pressed }) => [
                                styles.closeButton,
                                pressed && styles.closeButtonPressed
                            ]}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
        color: '#FFFFFF',
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
        color: '#c7e1f1ff',
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
        height: hp(180),
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
        gap: hp(6),
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