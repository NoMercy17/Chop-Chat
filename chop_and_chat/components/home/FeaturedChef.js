import { useMemo, useState, useContext, useCallback } from 'react';
import { Text, View, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { getCloudinaryUrl } from '../../utils/cloudinaryUrl';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useChefFeed } from '../../context/ChefFeedContext';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { navigateToProfile } from '../../utils/navigation';
import ChefPostDetailModal from '../posts/ChefPostDetailModal';
import DishDetailModal from '../posts/DishDetailModal';
import CommentsModal from '../posts/CommentsModal';

export default function FeaturedChef() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    
    const { token, user } = useContext(AuthContext);
    const { feedItems, handleLike, handleSave, addComment } = useChefFeed();

    const [chefPostDetailVisible, setChefPostDetailVisible] = useState(false);
    const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);

    const [selectedItemId, setSelectedItemId] = useState(null);
    const [selectedDish, setSelectedDish] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [commentError, setCommentError] = useState(null);

    // Derive the selected item from context based on ID
    const selectedItem = useMemo(() => {
        if (!selectedItemId) return null;
        return feedItems.find(item => item.id === selectedItemId) || null;
    }, [selectedItemId, feedItems]);

    // Show only the 2 most recent chef reactions
    const quickItems = useMemo(() => feedItems.slice(0, 2), [feedItems]);

    // --- HANDLERS ---

    const handleOpenComments = useCallback(async (item) => {
        setChefPostDetailVisible(false);
        setComments([]);
        setCommentsLoading(true);
        setTimeout(() => setCommentsModalVisible(true), 200);
        try {
            const data = await api.get(`/chef/${item.id}/comments`, token);
            setComments(data?.comments || []);
        } catch (error) {
            console.error('[FeaturedChef] fetchComments:', error.message);
        } finally {
            setCommentsLoading(false);
        }
    }, [token]);

    const submitComment = useCallback(async () => {
        const text = newComment.trim();
        if (!text || !selectedItemId) return;

        const tempId = `temp-${Date.now()}`;
        setComments(curr => [...curr, {
            id: tempId, authorId: user?.id,
            author: user?.name || 'You',
            initials: (user?.name || 'YO').substring(0, 2).toUpperCase(),
            text, timestamp: 'just now',
        }]);
        setNewComment('');

        const result = await addComment(selectedItemId, text);
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
    }, [newComment, selectedItemId, addComment, user]);

    const handleCloseComments = () => {
        setCommentsModalVisible(false);
        setComments([]);
        setNewComment('');
        setCommentError(null);
    };

    const renderQuickCard = (item) => {
        if (!item) return null;
        
        const isReaction = item.contentType === 'reaction';
        const displayTitle = isReaction ? item.reaction.targetPost?.title : item.post?.title;
        const displayText = isReaction ? item.reaction.text : item.post?.caption;

        return (
            <Pressable 
                key={item.id} 
                style={({ pressed }) => [
                    styles.reviewCard,
                    { backgroundColor: theme.chefCardBackground },
                    pressed && styles.reviewCardPressed
                ]}
                onPress={() => {
                    setSelectedItemId(item.id);
                    setChefPostDetailVisible(true);
                }}
            >
                <View style={[styles.cardHeader, { backgroundColor: theme.chefCardHeaderBg }]}>
                    <View style={[styles.chefAvatar, { backgroundColor: theme.primary }]}>
                        {item.chef.photo ? (
                            <Image
                                source={{ uri: getCloudinaryUrl(item.chef.photo, { width: 96, height: 96, crop: 'fill', gravity: 'face' }) }}
                                style={styles.chefAvatarImg}
                            />
                        ) : (
                            <Text style={[styles.chefInitial, { color: theme.textInverse }]}>{item.chef.avatar}</Text>
                        )}
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.reviewTitle, { color: theme.textPrimary }]} numberOfLines={1}>{displayTitle}</Text>
                        {isReaction && (
                            <Text style={[styles.reactionTarget, { color: theme.textSecondary }]} numberOfLines={1}>
                                on @{item.reaction.targetAuthor?.name || 'User'}'s post
                            </Text>
                        )}
                    </View>
                </View>
                
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                
                <View style={[styles.reviewContent, { backgroundColor: theme.chefCardContentBg }]}>
                    <Text style={[styles.reviewText, { color: theme.textPrimary }]} numberOfLines={3}>{displayText}</Text>
                    <View style={styles.cardFooter}>
                        <Pressable
                            onPress={(e) => {
                                e.stopPropagation();
                                navigateToProfile(navigation, item.chef.id, item.chef.name, user?.id);
                            }}
                            style={({pressed}) => pressed && {opacity: 0.7}}
                        >
                            <Text style={[styles.reviewChef, { color: theme.primary }]}>{item.chef.name}</Text>
                        </Pressable>
                        {item.liked && <Ionicons name="heart" size={12} color={theme.likeColor} />}
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Chef Spotlight</Text>

                <Pressable 
                   style={({ pressed }) => [
                       styles.subtitleButton,
                       pressed && styles.subtitleButtonPressed
                   ]}
                    onPress={() => navigation.navigate('AllChefReviews')}
                    >
                    <View style={styles.subtitleContent}>
                        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>See what pros think</Text>
                        <Ionicons name="arrow-forward" size={fp(14)} color={theme.textSecondary} />
                    </View>
                </Pressable>
            </View>
            
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {quickItems.length > 0 ? (
                    quickItems.map((item) => renderQuickCard(item))
                ) : (
                    <Text style={{ color: theme.textTertiary, marginLeft: wp(20) }}>No recent chef reviews</Text>
                )}
                
                <Pressable 
                    style={({ pressed }) => [
                        styles.moreCard,
                        pressed && styles.moreCardPressed
                    ]}
                    onPress={() => navigation.navigate('AllChefReviews')}
                >
                    <View style={styles.glassBackground}>
                        <View style={styles.moreCardContent}>
                            <Text style={styles.moreCardText}>More</Text>
                        </View>
                    </View>
                </Pressable>
            </ScrollView>

            <ChefPostDetailModal
                visible={chefPostDetailVisible}
                onClose={() => {
                    setChefPostDetailVisible(false);
                    setSelectedItemId(null);
                }}
                item={selectedItem}
                onLike={handleLike}
                onSave={handleSave}
                onComment={handleOpenComments}
                onTitlePress={(item) => {
                    setChefPostDetailVisible(false);
                    setTimeout(() => {
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
                    }, 100);
                }}
            />

            <DishDetailModal
                visible={dishDetailModalVisible}
                onClose={() => {
                    setDishDetailModalVisible(false);
                    setSelectedDish(null);
                }}
                dish={selectedDish}
            />

            <CommentsModal
                visible={commentsModalVisible}
                onClose={handleCloseComments}
                comments={comments}
                loading={commentsLoading}
                newComment={newComment}
                onCommentChange={(t) => { setNewComment(t); setCommentError(null); }}
                onAddComment={submitComment}
                errorMessage={commentError}
                onAuthorPress={(comment) => {
                    handleCloseComments();
                    navigateToProfile(navigation, comment.authorId, comment.author, user?.id);
                }}
                theme={theme}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: SPACING.sectionGap,
        paddingBottom: hp(4),
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
        paddingHorizontal: SPACING.screenPadding,
        gap: SPACING.itemGap,
    },
    reviewCard: {
        width: wp(280),
        backgroundColor: '#FFFFFF',
        borderRadius: wp(16),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(2) },
        shadowOpacity: 0.08,
        shadowRadius: wp(12),
        elevation: 3,
        marginRight: wp(12),
    },
    reviewCardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    cardHeader: {
        backgroundColor: '#F9FAFB',
        padding: wp(16),
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(12),
    },
    chefAvatar: {
        width: wp(48),
        height: wp(48),
        backgroundColor: '#3B82F6',
        borderRadius: wp(24),
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    chefAvatarImg: {
        width: '100%',
        height: '100%',
    },
    chefInitial: {
        fontSize: fp(18),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerInfo: {
        flex: 1,
    },
    reviewTitle: {
        fontSize: fp(14),
        fontWeight: '700',
        color: '#111827',
    },
    reactionTarget: {
        fontSize: fp(11),
        color: '#9CA3AF',
        marginTop: hp(2),
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: wp(16),
    },
    reviewContent: {
        padding: wp(12),
        backgroundColor: '#FFFFFF',
        height: hp(100),
        justifyContent: 'space-between',
    },
    reviewText: {
        fontSize: fp(14),
        fontWeight: '500',
        color: '#374151',
        lineHeight: hp(20),
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reviewChef: {
        fontSize: fp(13),
        color: '#6B7280',
        fontWeight: '500',
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
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
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
        color: '#3B82F6',
        letterSpacing: 0.3,
    },
});
