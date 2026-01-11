import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { wp, hp, fp, SPACING } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { FOLLOWED_CHEF_IDS } from '../data/chefFeedData';
import { useChefFeed } from '../context/ChefFeedContext';

const CATEGORIES = ['Following', 'All'];

export default function AllChefReviews() {
    const { feedItems, handleLike, handleSave } = useChefFeed();
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    // Filter feed items based on selected category
    const filteredItems = selectedCategory === 'All' 
        ? feedItems 
        : feedItems.filter(item => FOLLOWED_CHEF_IDS.includes(item.chef.id));

    // Render card based on content type for main feed
    const renderFeedCard = (item) => {
        const isReaction = item.contentType === 'reaction';
        const isOwnReaction = isReaction && item.reaction?.targetAuthor?.id === item.chef.id;
        
        // For reactions: show original post title at top, reaction text as content
        // For posts: show chef's post title and caption
        const displayTitle = isReaction 
            ? item.reaction.targetPost?.title 
            : item.post?.title;
        
        const displayText = isReaction 
            ? item.reaction.text 
            : item.post?.caption;

        return (
            <View
                key={item.id}
                style={styles.feedCard}
            >
                {/* Chef Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.chefAvatar}>
                        <Text style={styles.chefInitial}>{item.chef.avatar}</Text>
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.chefName}>{item.chef.name}</Text>
                        {isReaction && !isOwnReaction && (
                            <View style={styles.reactionContextRow}>
                                <Text style={styles.reactionContext}>reacted to </Text>
                                <Pressable 
                                    onPress={() => console.log('Navigate to user:', item.reaction.targetAuthor.id)}
                                    style={({ pressed }) => pressed && styles.targetAuthorPressed}
                                >
                                    <Text style={styles.targetAuthor}>@{item.reaction.targetAuthor.name}</Text>
                                </Pressable>
                                <Text style={styles.reactionContext}>'s post</Text>
                            </View>
                        )}
                        {isOwnReaction && (
                            <Text style={styles.reactionContext}>
                                replied to their own post
                            </Text>
                        )}
                    </View>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                    <Text style={styles.contentTitle}>{displayTitle}</Text>
                    <Text style={styles.contentText}>{displayText}</Text>
                </View>

                {/* Target Post Preview (for reactions) */}
                {isReaction && (
                    <View style={styles.targetPostPreview}>
                        <View style={styles.targetPostHeader}>
                            <View style={styles.targetAvatarSmall}>
                                <Text style={styles.targetInitialSmall}>{item.reaction.targetAuthor.avatar}</Text>
                            </View>
                            <Text style={styles.targetPostTitle} numberOfLines={1}>
                                {item.reaction.targetPost?.title}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Engagement Stats - These belong to the FEED ITEM, not the original post */}
                <View style={styles.engagementBar}>
                    <View style={styles.leftStats}>
                        <Pressable 
                            style={({ pressed }) => [
                                styles.statButton,
                                pressed && styles.statButtonPressed
                            ]}
                            onPress={() => handleLike(item.id)}
                        >
                            <Ionicons 
                                name={item.liked ? "heart" : "heart-outline"} 
                                size={fp(18)} 
                                color={item.liked ? "#b90808ff" : "#6B7280"} 
                            />
                            <Text style={[styles.statText, item.liked && styles.statTextLiked]}>
                                {item.likes}
                            </Text>
                        </Pressable>

                        <Pressable 
                            style={({ pressed }) => [
                                styles.statButton,
                                pressed && styles.statButtonPressed
                            ]}
                            onPress={() => console.log('Comments pressed:', item.id)}
                        >
                            <Ionicons name="chatbubble-outline" size={fp(17)} color="#6B7280" />
                            <Text style={styles.statText}>{item.comments}</Text>
                        </Pressable>
                    </View>
                    
                    <Pressable 
                        style={({ pressed }) => [
                            styles.saveButton,
                            pressed && styles.statButtonPressed
                        ]}
                        onPress={() => handleSave(item.id)}
                    >
                        <Ionicons 
                            name={item.saved ? "bookmark" : "bookmark-outline"} 
                            size={fp(18)} 
                            color={item.saved ? "#b90808ff" : "#6B7280"} 
                        />
                    </Pressable>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Category Tabs */}
            <View style={styles.categoryWrapper}>
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
    },
    categoryContainer: {
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
    
    // Feed Card Styles
    feedCard: {
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
    feedCardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(16),
        paddingBottom: hp(12),
    },
    chefAvatar: {
        width: wp(44),
        height: wp(44),
        backgroundColor: '#3B82F6',
        borderRadius: wp(22),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(12),
    },
    chefInitial: {
        fontSize: fp(16),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerText: {
        flex: 1,
    },
    chefName: {
        fontSize: fp(15),
        fontWeight: '600',
        color: '#111827',
    },
    reactionContext: {
        fontSize: fp(12),
        color: '#6B7280',
    },
    reactionContextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: hp(2),
    },
    targetAuthor: {
        fontSize: fp(12),
        fontWeight: '600',
        color: '#3B82F6',
    },
    targetAuthorPressed: {
        opacity: 0.6,
    },
    cardContent: {
        paddingHorizontal: wp(16),
        paddingBottom: hp(12),
    },
    contentTitle: {
        fontSize: fp(16),
        fontWeight: '700',
        color: '#111827',
        marginBottom: hp(6),
    },
    contentText: {
        fontSize: fp(14),
        color: '#374151',
        lineHeight: hp(20),
    },
    targetPostPreview: {
        backgroundColor: '#F9FAFB',
        marginHorizontal: wp(12),
        marginBottom: hp(12),
        borderRadius: wp(12),
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    targetPostHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(12),
    },
    targetAvatarSmall: {
        width: wp(28),
        height: wp(28),
        backgroundColor: '#9CA3AF',
        borderRadius: wp(14),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(10),
    },
    targetInitialSmall: {
        fontSize: fp(11),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    targetPostTitle: {
        flex: 1,
        fontSize: fp(13),
        fontWeight: '500',
        color: '#6B7280',
    },
    
    // Engagement Bar
    engagementBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(16),
        paddingVertical: hp(12),
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    leftStats: {
        flexDirection: 'row',
        gap: wp(20),
    },
    statButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(6),
        paddingVertical: hp(4),
        paddingHorizontal: wp(8),
        borderRadius: wp(8),
    },
    statButtonPressed: {
        backgroundColor: '#F3F4F6',
    },
    saveButton: {
        padding: wp(4),
    },
    statText: {
        fontSize: fp(13),
        color: '#6B7280',
        fontWeight: '500',
    },
    statTextLiked: {
        color: '#b90808ff',
    },
});
