import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

export default function ChefPostDetailModal({ visible, onClose, item, onChefHeaderPress, onTitlePress }) {
    const { theme } = useTheme();

    if (!item) return null;

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
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: theme.screenBackground }]}>
                {/* Header with close button */}
                <View style={styles.headerBar}>
                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [
                            styles.closeButton,
                            pressed && styles.closeButtonPressed
                        ]}
                    >
                        <Ionicons name="close" size={fp(24)} color={theme.textPrimary} />
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Feed Card - Same structure as AllChefReviews */}
                    <View style={[styles.feedCard, { backgroundColor: theme.chefCardBackground }]}>
                        
                        {/* CHEF HEADER - Pressable to go to profile */}
                        <Pressable
                            onPress={() => {
                                console.log('Navigate to chef profile:', item.chef.id);
                                onChefHeaderPress?.(item.chef);
                            }}
                            style={({ pressed }) => [
                                styles.cardHeader,
                                { backgroundColor: theme.chefCardHeaderBg },
                                pressed && styles.cardHeaderPressed
                            ]}
                        >
                            <View style={[styles.chefAvatar, { backgroundColor: theme.primary }]}>
                                <Text style={styles.chefInitial}>{item.chef.avatar}</Text>
                            </View>
                            <View style={styles.headerText}>
                                <Text style={[styles.chefName, { color: theme.textPrimary }]}>{item.chef.name}</Text>
                                {isReaction && !isOwnReaction && (
                                    <View style={styles.reactionContextRow}>
                                        <Text style={[styles.reactionContext, { color: theme.textSecondary }]}>reacted to </Text>
                                        <Text style={[styles.targetAuthor, { color: theme.primary }]}>@{item.reaction.targetAuthor.name}</Text>
                                        <Text style={[styles.reactionContext, { color: theme.textSecondary }]}>'s post</Text>
                                    </View>
                                )}
                                {isOwnReaction && (
                                    <Text style={[styles.reactionContext, { color: theme.textSecondary }]}>
                                        replied to their own post
                                    </Text>
                                )}
                            </View>
                        </Pressable>

                        {/* CONTENT - Pressable to open full dish detail */}
                        <Pressable
                            onPress={() => {
                                console.log('Opening full dish detail for:', displayTitle);
                                onTitlePress?.(item);
                            }}
                            style={({ pressed }) => [
                                styles.cardContent,
                                { backgroundColor: theme.chefCardContentBg },
                                pressed && styles.cardContentPressed
                            ]}
                        >
                            <Text style={[styles.contentTitle, { color: theme.textPrimary }]}>{displayTitle}</Text>
                            <Text style={[styles.contentText, { color: theme.textSecondary }]}>{displayText}</Text>
                        </Pressable>

                        {/* TARGET POST PREVIEW (for reactions) */}
                        {isReaction && (
                            <View style={[styles.targetPostPreview, { backgroundColor: theme.chefCardHeaderBg, borderColor: theme.border }]}>
                                <View style={styles.targetPostHeader}>
                                    <View style={[styles.targetAvatarSmall, { backgroundColor: theme.primary }]}>
                                        <Text style={styles.targetInitialSmall}>{item.reaction.targetAuthor.avatar}</Text>
                                    </View>
                                    <Text style={[styles.targetPostTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                                        {item.reaction.targetPost?.title}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* ENGAGEMENT STATS */}
                        <View style={[styles.engagementBar, { backgroundColor: theme.chefCardContentBg }]}>
                            <View style={styles.leftStats}>
                                <Pressable 
                                    style={({ pressed }) => [
                                        styles.statButton,
                                        pressed && styles.statButtonPressed
                                    ]}
                                    onPress={() => console.log('Like pressed:', item.id)}
                                >
                                    <Ionicons 
                                        name={item.liked ? "heart" : "heart-outline"} 
                                        size={fp(18)} 
                                        color={item.liked ? theme.likeColor : theme.textSecondary} 
                                    />
                                    <Text style={[styles.statText, { color: theme.textSecondary }, item.liked && { color: theme.likeColor }]}>
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
                                    <Ionicons name="chatbubble-outline" size={fp(17)} color={theme.textSecondary} />
                                    <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.comments}</Text>
                                </Pressable>
                            </View>
                            
                            <Pressable 
                                style={({ pressed }) => [
                                    styles.saveButton,
                                    pressed && styles.statButtonPressed
                                ]}
                                onPress={() => console.log('Save pressed:', item.id)}
                            >
                                <Ionicons 
                                    name={item.saved ? "bookmark" : "bookmark-outline"} 
                                    size={fp(18)} 
                                    color={item.saved ? theme.saveColor : theme.textSecondary} 
                                />
                            </Pressable>
                        </View>
                    </View>

                    <View style={{ height: hp(20) }} />
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: SPACING.screenPadding,
        paddingVertical: hp(12),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    closeButton: {
        padding: wp(8),
        borderRadius: wp(8),
    },
    closeButtonPressed: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.screenPadding,
        paddingVertical: hp(20),
        paddingBottom: hp(40),
    },

    // Feed Card (AllChefReviews style)
    feedCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: wp(16),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(2) },
        shadowOpacity: 0.08,
        shadowRadius: wp(12),
        elevation: 3,
    },

    // Card Header (Pressable to navigate to profile)
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(16),
        paddingBottom: hp(12),
    },
    cardHeaderPressed: {
        opacity: 0.7,
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

    // Card Content (Pressable to open full dish detail)
    cardContent: {
        paddingHorizontal: wp(16),
        paddingBottom: hp(12),
    },
    cardContentPressed: {
        opacity: 0.7,
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

    // Target Post Preview
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
});
