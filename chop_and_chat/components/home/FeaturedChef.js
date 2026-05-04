import { useMemo, useState } from 'react';
import { Text, View, StyleSheet, ScrollView, Pressable, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useChefFeed } from '../../context/ChefFeedContext';
import ChefPostDetailModal from '../posts/ChefPostDetailModal';
import DishDetailModal from '../posts/DishDetailModal';

export default function FeaturedChef() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    
    const { feedItems, handleLike, handleSave, updateCommentCount } = useChefFeed();
    
    const [chefPostDetailVisible, setChefPostDetailVisible] = useState(false);
    const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [selectedDish, setSelectedDish] = useState(null);
    const [newComment, setNewComment] = useState('');

    // Derive the selected item from context based on ID
    const selectedItem = useMemo(() => {
        if (!selectedItemId) return null;
        return feedItems.find(item => item.id === selectedItemId) || null;
    }, [selectedItemId, feedItems]);

    // Show only the 2 most recent chef reactions
    const quickItems = useMemo(() => feedItems.slice(0, 2), [feedItems]);

    // --- HANDLERS ---

    const handleOpenComments = (item) => {
        setChefPostDetailVisible(false);
        setTimeout(() => {
            setCommentsModalVisible(true);
        }, 200);
    };

    const submitComment = () => {
        if (newComment.trim() && selectedItemId) {
            // TODO: wire to backend POST /comments
            updateCommentCount(selectedItemId);
            setNewComment('');
        }
    };

    const handleCloseComments = () => {
        setCommentsModalVisible(false);
        setNewComment('');
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
                        <Text style={[styles.chefInitial, { color: theme.textInverse }]}>{item.chef.avatar}</Text>
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
                                navigation.navigate('OtherUserProfile', {
                                    userId: item.chef.id,
                                    userName: item.chef.name
                                });
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
                                    
                                    <ScrollView 
                                        style={styles.commentsScrollView}
                                        showsVerticalScrollIndicator={true}
                                    >
                                        <View style={styles.emptyCommentsState}>
                                            <Ionicons name="chatbubble-outline" size={fp(38)} color={theme.textTertiary} />
                                            <Text style={[styles.emptyCommentsText, { color: theme.textSecondary }]}>Comments coming soon</Text>
                                        </View>
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
    emptyCommentsState: {
        alignItems: 'center',
        paddingVertical: hp(40),
    },
    emptyCommentsText: {
        fontSize: fp(16),
        marginTop: hp(12),
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
