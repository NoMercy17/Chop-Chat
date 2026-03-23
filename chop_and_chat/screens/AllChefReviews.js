import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { wp, hp, fp } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { FOLLOWED_CHEF_IDS, chefReactionComments } from '../data/chefFeedData';
import { useChefFeed } from '../context/ChefFeedContext'; 
import DishDetailModal from '../components/posts/DishDetailModal'; 
import CommentsModal from '../components/posts/CommentsModal';
import CategoryHeader from '../components/home/CategoryHeader';

const CATEGORIES = ['Following', 'All'];

export default function AllChefReviews({ navigation }) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { feedItems, handleLike, handleSave, updateCommentCount } = useChefFeed();
    
    // State
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [selectedPostForComments, setSelectedPostForComments] = useState(null);
    const [newComment, setNewComment] = useState('');

    const filteredItems = useMemo(() => {
        let items = selectedCategory === 'All' 
            ? feedItems 
            : feedItems.filter(item => FOLLOWED_CHEF_IDS.includes(item.chef.id));
        
        return items.filter(item => {
            if (item.contentType === 'reaction') {
                return item.reaction?.targetAuthor?.id !== item.chef.id;
            }
            return true;
        });
    }, [selectedCategory, feedItems]);

    // Handlers
    const handleOpenDish = (item) => {
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
            updateCommentCount(selectedPostForComments.id);
            setNewComment('');
        }
    };

    const renderFeedCard = (item) => {
        const isReaction = item.contentType === 'reaction';
        const isOwnReaction = isReaction && item.reaction?.targetAuthor?.id === item.chef.id;
        const displayTitle = isReaction ? item.reaction.targetPost?.title : item.post?.title;
        const displayText = isReaction ? item.reaction.text : item.post?.caption;

        return (
            <View key={item.id} style={[styles.feedCard, { backgroundColor: theme.chefCardBackground }]}>
                <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
                    <Pressable 
                        style={styles.headerLeft}
                        onPress={() => navigation.navigate('OtherUserProfile', {
                            userId: item.chef.id,
                            userName: item.chef.name
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

                <View style={[styles.cardContent, { backgroundColor: theme.chefCardContentBg }]}>
                    {isReaction && !isOwnReaction && (
                        <View style={styles.contextRow}>
                            <Ionicons name="return-down-forward" size={fp(14)} color={theme.textTertiary} />
                            <Text style={[styles.contextText, { color: theme.textSecondary }]}>Reacted to </Text>
                            <Pressable onPress={() => navigation.navigate('OtherUserProfile', { userId: item.reaction.targetAuthor.id, userName: item.reaction.targetAuthor.name })}>
                                <Text style={[styles.targetAuthor, { color: theme.primary }]}>@{item.reaction.targetAuthor.name}</Text>
                            </Pressable>
                            <Text style={[styles.contextText, { color: theme.textSecondary }]}>'s post</Text>
                        </View>
                    )}

                    <Pressable style={({pressed}) => [styles.titleRow, pressed && {opacity: 0.7}]} onPress={() => handleOpenDish(item)}>
                        <Text style={[styles.contentTitle, { color: theme.textPrimary }]}>{displayTitle}</Text>
                        <Ionicons name="chevron-forward" size={fp(18)} color={theme.primary} />
                    </Pressable>

                    <Text style={[styles.contentText, { color: theme.textSecondary }]}>{displayText}</Text>
                </View>

                <View style={[styles.engagementBar, { borderTopColor: theme.border }]}>
                    <View style={styles.leftStats}>
                        <Pressable style={styles.statButton} onPress={() => handleLike(item.id)}>
                            <Ionicons name={item.liked ? "heart" : "heart-outline"} size={fp(20)} color={item.liked ? theme.likeColor : theme.textPrimary} />
                            <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.likes}</Text>
                        </Pressable>
                        <Pressable style={styles.statButton} onPress={() => handleOpenComments(item)}>
                            <Ionicons name="chatbubble-outline" size={fp(19)} color={theme.textPrimary} />
                            <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.comments}</Text>
                        </Pressable>
                    </View>
                    <Pressable style={styles.saveButton} onPress={() => handleSave(item.id)}>
                        <Ionicons name={item.saved ? "bookmark" : "bookmark-outline"} size={fp(20)} color={item.saved ? theme.saveColor : theme.textPrimary} />
                    </Pressable>
                </View>
            </View>
        );
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
                {filteredItems.length > 0 ? filteredItems.map(renderFeedCard) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={fp(48)} color="#9CA3AF" />
                        <Text style={styles.emptyStateTitle}>No posts from followed chefs</Text>
                        <Text style={styles.emptyStateSubtitle}>Follow some chefs to see their content here!</Text>
                    </View>
                )}
            </ScrollView>

            <DishDetailModal
                visible={dishDetailModalVisible}
                onClose={() => { setDishDetailModalVisible(false); setSelectedDish(null); }}
                dish={selectedDish}
            />

            <CommentsModal 
                visible={commentsModalVisible}
                onClose={() => setCommentsModalVisible(false)}
                comments={selectedPostForComments ? chefReactionComments[selectedPostForComments.id] : []}
                newComment={newComment}
                onCommentChange={setNewComment}
                onAddComment={submitComment}
                theme={theme}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { flex: 1 },
    content: { padding: wp(16), paddingBottom: hp(40) },
    feedCard: { borderRadius: wp(16), marginBottom: hp(20), overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: wp(12), borderBottomWidth: 1 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(10) },
    chefAvatar: { width: wp(40), height: wp(40), borderRadius: wp(20), justifyContent: 'center', alignItems: 'center' },
    chefInitial: { color: '#FFF', fontSize: fp(18), fontWeight: '700' },
    chefName: { fontSize: fp(16), fontWeight: '700' },
    timestamp: { fontSize: fp(12) },
    cardContent: { padding: wp(16) },
    contextRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(8), gap: wp(4) },
    contextText: { fontSize: fp(13) },
    targetAuthor: { fontSize: fp(13), fontWeight: '600' },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(8) },
    contentTitle: { fontSize: fp(18), fontWeight: '700', flex: 1 },
    contentText: { fontSize: fp(14), lineHeight: fp(20) },
    engagementBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: wp(12), borderTopWidth: 1 },
    leftStats: { flexDirection: 'row', gap: wp(16) },
    statButton: { flexDirection: 'row', alignItems: 'center', gap: wp(4) },
    statText: { fontSize: fp(14), fontWeight: '600' },
    saveButton: { padding: wp(4) },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: hp(100), paddingHorizontal: wp(40) },
    emptyStateTitle: { fontSize: fp(18), fontWeight: '700', color: '#4B5563', marginTop: hp(16) },
    emptyStateSubtitle: { fontSize: fp(14), color: '#6B7280', textAlign: 'center', marginTop: hp(8) }
});
