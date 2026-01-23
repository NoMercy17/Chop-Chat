import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { wp, hp, fp, SPACING } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { FOLLOWED_CHEF_IDS, chefReactionComments } from '../data/chefFeedData';
import { useChefFeed } from '../context/ChefFeedContext'; 
import DishDetailModal from '../components/posts/DishDetailModal'; 
import { useMemo } from 'react';


const CATEGORIES = ['Following', 'All'];

export default function AllChefReviews({ navigation }) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    
    // Global State
    const { feedItems, handleLike, handleSave, updateCommentCount } = useChefFeed();
    
    // Local State
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    // Modal States
    const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [selectedPostForComments, setSelectedPostForComments] = useState(null);
    const [newComment, setNewComment] = useState('');

    // Filter feed items based on selected category AND exclude self-reviews
    const filteredItems = useMemo(() => {
        let items = selectedCategory === 'All' 
            ? feedItems 
            : feedItems.filter(item => FOLLOWED_CHEF_IDS.includes(item.chef.id));
        
        // Filter out self-reviews (reactions where chef is reviewing their own post)
        return items.filter(item => {
            if (item.contentType === 'reaction') {
                // Exclude if chef is reacting to their own post
                return item.reaction?.targetAuthor?.id !== item.chef.id;
            }
            return true;
        });
    }, [selectedCategory, feedItems]);

    // --- HANDLERS ---

    const handleOpenDish = (item) => {
        // Transform chef feed item to proper dish format for DishDetailModal
        const isReaction = item.contentType === 'reaction';
        const dishData = {
            title: isReaction ? item.reaction?.targetPost?.title : item.post?.title,
            description: isReaction ? item.reaction?.targetPost?.caption : item.post?.caption,
            image: isReaction ? item.reaction?.targetPost?.image : item.post?.image,
            ingredients: item.reaction?.targetPost?.ingredients || item.post?.ingredients,
            instructions: item.reaction?.targetPost?.instructions || item.post?.instructions,
            utensils: item.reaction?.targetPost?.utensils || item.post?.utensils,
            cookTime: item.reaction?.targetPost?.cookTime || item.post?.cookTime,
            difficulty: item.reaction?.targetPost?.difficulty || item.post?.difficulty,
        };
        setSelectedDish(dishData);
        setDishDetailModalVisible(true);
    };

    const handleOpenComments = (item) => {
        setSelectedPostForComments(item);
        setCommentsModalVisible(true);
    };

    const submitComment = () => {
        if (newComment.trim() && selectedPostForComments) {
            console.log("Comment submitted for:", selectedPostForComments?.id, newComment);
            
            // Update comment count in context
            updateCommentCount(selectedPostForComments.id);
            
            // Clear input but DON'T close modal (like Community Posts)
            setNewComment('');
        }
    };

    const handleCloseComments = () => {
        setCommentsModalVisible(false);
        setSelectedPostForComments(null);
        setNewComment('');
    };

    // Render card
    const renderFeedCard = (item) => {
        const isReaction = item.contentType === 'reaction';
        const isOwnReaction = isReaction && item.reaction?.targetAuthor?.id === item.chef.id;
        
        const displayTitle = isReaction ? item.reaction.targetPost?.title : item.post?.title;
        const displayText = isReaction ? item.reaction.text : item.post?.caption;

        return (
            <View
                key={item.id}
                style={[styles.feedCard, { backgroundColor: theme.chefCardBackground }]}
            >
                {/* --- HEADER (Avatar + Name) --- */}
                <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
                    <Pressable 
                        style={styles.headerLeft}
                        onPress={() => navigation.navigate('OtherUserProfile', {
                            userId: item.chef.id,
                            userName: item.chef.name,
                            userAvatar: item.chef.avatar || null,
                            username: `@${item.chef.name.replace(/\s+/g, '').toLowerCase()}`
                        })}
                    >
                        <View style={[styles.chefAvatar, { backgroundColor: theme.primary }]}>
                            <Text style={styles.chefInitial}>{item.chef.avatar}</Text>
                        </View>
                        <View>
                            <Text style={[styles.chefName, { color: theme.textPrimary }]}>{item.chef.name}</Text>
                            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>2 hours ago</Text>
                        </View>
                    </Pressable>
                </View>

                {/* --- CONTENT BODY --- */}
                <View style={[styles.cardContent, { backgroundColor: theme.chefCardContentBg }]}>
                    
                    {/* Context Row (Reacted to...) */}
                    {isReaction && !isOwnReaction && (
                        <View style={styles.contextRow}>
                            <Ionicons name="return-down-forward" size={fp(14)} color={theme.textTertiary} />
                            <Text style={[styles.contextText, { color: theme.textSecondary }]}>
                                Reacted to{' '}
                            </Text>
                            {/* CLICKABLE USERNAME */}
                            <Pressable 
                                onPress={() => navigation.navigate('OtherUserProfile', {
                                    userId: item.reaction.targetAuthor.id,
                                    userName: item.reaction.targetAuthor.name,
                                    userAvatar: item.reaction.targetAuthor.avatar || null,
                                    username: `@${item.reaction.targetAuthor.name.replace(/\s+/g, '').toLowerCase()}`
                                })}
                                style={({pressed}) => pressed && {opacity: 0.7}}
                            >
                                <Text style={[styles.targetAuthor, { color: theme.primary }]}>
                                    @{item.reaction.targetAuthor.name}
                                </Text>
                            </Pressable>
                            <Text style={[styles.contextText, { color: theme.textSecondary }]}>'s post</Text>
                        </View>
                    )}

                    {/* Title Row (Clickable with Blue Chevron) */}
                    <Pressable 
                        style={({pressed}) => [styles.titleRow, pressed && {opacity: 0.7}]}
                        onPress={() => handleOpenDish(item)}
                    >
                        <Text style={[styles.contentTitle, { color: theme.textPrimary }]}>{displayTitle}</Text>
                        <Ionicons name="chevron-forward" size={fp(18)} color={theme.primary} />
                    </Pressable>

                    {/* Body Text */}
                    <Text style={[styles.contentText, { color: theme.textSecondary }]}>{displayText}</Text>
                </View>

                {/* --- ENGAGEMENT BAR --- */}
                <View style={[styles.engagementBar, { borderTopColor: theme.border }]}>
                    <View style={styles.leftStats}>
                        {/* Like */}
                        <Pressable 
                            style={({ pressed }) => [styles.statButton, pressed && styles.statButtonPressed]}
                            onPress={() => handleLike(item.id)}
                        >
                            <Ionicons 
                                name={item.liked ? "heart" : "heart-outline"} 
                                size={fp(20)} 
                                color={item.liked ? theme.likeColor : theme.textPrimary} 
                            />
                            <Text style={[styles.statText, { color: theme.textSecondary }]}>
                                {item.likes}
                            </Text>
                        </Pressable>

                        {/* Comment - shows actual comment count from context */}
                        <Pressable 
                            style={({ pressed }) => [styles.statButton, pressed && styles.statButtonPressed]}
                            onPress={() => handleOpenComments(item)}
                        >
                            <Ionicons name="chatbubble-outline" size={fp(19)} color={theme.textPrimary} />
                            <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.comments}</Text>
                        </Pressable>
                    </View>
                    
                    {/* Save */}
                    <Pressable 
                        style={({ pressed }) => [styles.saveButton, pressed && styles.statButtonPressed]}
                        onPress={() => handleSave(item.id)}
                    >
                        <Ionicons 
                            name={item.saved ? "bookmark" : "bookmark-outline"} 
                            size={fp(20)} 
                            color={item.saved ? theme.saveColor : theme.textPrimary} 
                        />
                    </Pressable>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.screenBackground, paddingTop: insets.top }]}>
            {/* Category Tabs */}
            <View style={[styles.categoryWrapper, { backgroundColor: theme.screenBackground }]}>
                <Pressable 
                    style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
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
                {filteredItems.length > 0 ? filteredItems.map((item) => renderFeedCard(item)) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={fp(48)} color="#9CA3AF" />
                        <Text style={styles.emptyStateTitle}>No posts from followed chefs</Text>
                        <Text style={styles.emptyStateSubtitle}>Follow some chefs to see their content here!</Text>
                    </View>
                )}
            </ScrollView>

            {/* --- DISH DETAIL MODAL --- */}
            <DishDetailModal
                visible={dishDetailModalVisible}
                onClose={() => {
                    setDishDetailModalVisible(false);
                    setSelectedDish(null);
                }}
                dish={selectedDish}
            />

            {/* --- COMMENTS MODAL --- */}
            <Modal 
                visible={commentsModalVisible} 
                transparent={true} 
                animationType="slide"
                onRequestClose={handleCloseComments}
            >
                <TouchableWithoutFeedback onPress={handleCloseComments}>
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView 
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ width: '100%' }}
                        >
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                                        <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Comments</Text>
                                        <Pressable onPress={handleCloseComments}>
                                            <Text style={{color: theme.primary, fontWeight:'600'}}>Close</Text>
                                        </Pressable>
                                    </View>
                                    
                                    {/* SCROLLABLE COMMENTS SECTION */}
                                    <ScrollView 
                                        style={styles.commentsScrollView}
                                        contentContainerStyle={styles.commentsContent}
                                        showsVerticalScrollIndicator={true}
                                        bounces={true}
                                    >
                                        {/* Comments from mockData */}
                                        {selectedPostForComments && chefReactionComments[selectedPostForComments.id] && 
                                            chefReactionComments[selectedPostForComments.id].map((comment, index) => (
                                                <View key={comment.id || index} style={styles.commentItem}>
                                                    <View style={[styles.commentAvatar, { backgroundColor: '#E0F2FE' }]}>
                                                        <Text style={styles.commentAvatarText}>{comment.initials}</Text>
                                                    </View>
                                                    <View style={styles.commentContent}>
                                                        <Text style={[styles.commentAuthor, { color: theme.textPrimary }]}>{comment.author}</Text>
                                                        <Text style={[styles.commentText, { color: theme.textSecondary }]}>{comment.text}</Text>
                                                    </View>
                                                </View>
                                            ))
                                        }

                                        {/* Empty state when no comments */}
                                        {selectedPostForComments && (!chefReactionComments[selectedPostForComments.id] || chefReactionComments[selectedPostForComments.id].length === 0) && (
                                            <View style={styles.emptyCommentsState}>
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
                                        />
                                        <Pressable 
                                            onPress={submitComment}
                                            style={{padding: 8, backgroundColor: theme.primary, borderRadius: 20}}
                                        >
                                            <Ionicons name="send" size={16} color="white" />
                                        </Pressable>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    
    // Category Tabs
    categoryWrapper: {
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
    
    // --- FEED CARD STYLES ---
    feedCard: {
        borderRadius: wp(16),
        marginBottom: SPACING.itemGap,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(2) },
        shadowOpacity: 0.08,
        shadowRadius: wp(12),
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(16),
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(12),
    },
    chefAvatar: {
        width: wp(40),
        height: wp(40),
        borderRadius: wp(20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    chefInitial: {
        fontSize: fp(16),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    chefName: {
        fontSize: fp(16),
        fontWeight: '700',
    },
    timestamp: {
        fontSize: fp(12),
    },
    cardContent: {
        padding: wp(16),
    },
    contextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: hp(10),
    },
    contextText: {
        fontSize: fp(13),
        marginLeft: wp(4),
    },
    targetAuthor: {
        fontSize: fp(13),
        fontWeight: '600',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(8),
        marginBottom: hp(8),
    },
    contentTitle: {
        fontSize: fp(18),
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    contentText: {
        fontSize: fp(15),
        lineHeight: hp(22),
    },
    
    // Engagement Bar
    engagementBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(16),
        paddingVertical: hp(12),
        borderTopWidth: 1,
    },
    leftStats: {
        flexDirection: 'row',
        gap: wp(24),
    },
    statButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(6),
    },
    statButtonPressed: {
        opacity: 0.6,
    },
    saveButton: {
        padding: wp(4),
    },
    statText: {
        fontSize: fp(14),
        fontWeight: '600',
    },

    // Modal Styles (Comments)
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
        maxHeight: '80%',
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
    commentsScrollView: {
        maxHeight: hp(350),
        paddingHorizontal: wp(20),
    },
    commentsContent: {
        paddingVertical: hp(12),
    },
    commentItem: {
        flexDirection: 'row',
        gap: wp(10),
        marginBottom: hp(16),
    },
    commentAvatar: {
        width: wp(32),
        height: wp(32),
        borderRadius: wp(16),
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentAvatarText: {
        color: '#0284C7',
        fontSize: fp(10),
        fontWeight: '700',
    },
    commentContent: {
        flex: 1,
    },
    commentAuthor: {
        fontWeight: '600',
        fontSize: fp(13),
        marginBottom: hp(2),
    },
    commentText: {
        fontSize: fp(13),
        lineHeight: hp(18),
    },
    emptyCommentsState: {
        alignItems: 'center',
        paddingVertical: hp(40),
    },
    emptyCommentsText: {
        fontSize: fp(16),
        marginTop: hp(12),
    },
    emptyCommentsSubtext: {
        fontSize: fp(13),
        marginTop: hp(4),
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
    },
});