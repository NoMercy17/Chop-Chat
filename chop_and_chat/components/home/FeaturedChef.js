import { useMemo, useState } from 'react';
import { Text, View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { chefFeedItems } from '../../data/chefFeedData';
import ChefPostDetailModal from '../posts/ChefPostDetailModal';
import DishDetailModal from '../posts/DishDetailModal';

// Get 4 random items for the quick menu
const getRandomFeedItems = (items, count) => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

export default function FeaturedChef() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    
    const [chefPostDetailVisible, setChefPostDetailVisible] = useState(false);
    const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedDish, setSelectedDish] = useState(null);
    
    // Select 4 random feed items on mount
    const feedItems = useMemo(() => getRandomFeedItems(chefFeedItems, 4), []);

    // Render card based on content type
    const renderQuickCard = (item) => {
        const isReaction = item.contentType === 'reaction';
        const isOwnReaction = isReaction && item.reaction?.targetAuthor?.id === item.chef.id;
        
        // Get the title to display
        const displayTitle = isReaction 
            ? item.reaction.targetPost?.title 
            : item.post?.title;
        
        // Get the text content
        const displayText = isReaction 
            ? item.reaction.text 
            : item.post?.caption;

        return (
            <Pressable 
                key={item.id} 
                style={({ pressed }) => [
                    styles.reviewCard,
                    { backgroundColor: theme.chefCardBackground },
                    pressed && styles.reviewCardPressed
                ]}
                onPress={() => {
                    setSelectedItem(item);
                    setChefPostDetailVisible(true);
                }}
            >
                <View style={[styles.cardHeader, { backgroundColor: theme.chefCardHeaderBg }]}>
                    <View style={[styles.chefAvatar, { backgroundColor: theme.primary }]}>
                        <Text style={[styles.chefInitial, { color: theme.textInverse }]}>{item.chef.avatar}</Text>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.reviewTitle, { color: theme.textPrimary }]} numberOfLines={1}>{displayTitle}</Text>
                        {isReaction && !isOwnReaction && (
                            <Text style={[styles.reactionTarget, { color: theme.textSecondary }]} numberOfLines={1}>
                                on @{item.reaction.targetAuthor.name}'s post
                            </Text>
                        )}
                        {isOwnReaction && (
                            <Text style={[styles.reactionTarget, { color: theme.textSecondary }]} numberOfLines={1}>
                                replied to own post
                            </Text>
                        )}
                    </View>
                </View>
                
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                
                <View style={[styles.reviewContent, { backgroundColor: theme.chefCardContentBg }]}>
                    <Text style={[styles.reviewText, { color: theme.textPrimary }]} numberOfLines={3}>{displayText}</Text>
                    <View style={styles.cardFooter}>
                        <Text style={[styles.reviewChef, { color: theme.textSecondary }]}>{item.chef.name}</Text>
                        
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
                {feedItems.map((item) => renderQuickCard(item))}
                
                {/* More Button */}
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

            {/* Chef Post Detail Modal (First expansion - slightly bigger) */}
            <ChefPostDetailModal
                visible={chefPostDetailVisible}
                onClose={() => {
                    setChefPostDetailVisible(false);
                    setSelectedItem(null);
                }}
                item={selectedItem}
                onChefHeaderPress={(chef) => {
                    console.log('Chef header pressed, navigate to profile:', chef.id);
                }}
                onTitlePress={(item) => {
                    console.log('Title pressed, opening full dish detail');
                    // Open the dish detail modal
                    setSelectedDish(item);
                    setDishDetailModalVisible(true);
                }}
            />

            {/* Dish Detail Modal (Full expansion) */}
            <DishDetailModal
                visible={dishDetailModalVisible}
                onClose={() => {
                    setDishDetailModalVisible(false);
                    setSelectedDish(null);
                    // Reopen the chef post detail modal
                    setChefPostDetailVisible(true);
                }}
                dish={selectedDish}
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
    reactionBadge: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: wp(6),
        paddingVertical: hp(3),
        borderRadius: wp(8),
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
});