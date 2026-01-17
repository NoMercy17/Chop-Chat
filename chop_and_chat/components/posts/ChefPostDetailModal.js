import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

export default function ChefPostDetailModal({ 
    visible, 
    onClose, 
    item, 
    onTitlePress, 
    onLike, 
    onSave, 
    onComment 
}) {
    const { theme } = useTheme();

    if (!item) return null;

    const isReaction = item.contentType === 'reaction';
    const isOwnReaction = isReaction && item.reaction?.targetAuthor?.id === item.chef.id;
    
    const displayTitle = isReaction ? item.reaction.targetPost?.title : item.post?.title;
    const displayText = isReaction ? item.reaction.text : item.post?.caption;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable 
                    style={[styles.cardContainer, { backgroundColor: theme.cardBackground }]}
                    onPress={(e) => e.stopPropagation()}
                >
                        
                        {/* --- HEADER --- */}
                        <View style={[styles.header, { borderBottomColor: theme.border }]}>
                            <View style={styles.headerLeft}>
                                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                                    <Text style={styles.avatarText}>{item.chef.avatar}</Text>
                                </View>
                                <View>
                                    <Text style={[styles.chefName, { color: theme.textPrimary }]}>{item.chef.name}</Text>
                                    <Text style={[styles.timestamp, { color: theme.textSecondary }]}>2 hours ago</Text>
                                </View>
                            </View>
                            <Pressable onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={fp(24)} color={theme.textSecondary} />
                            </Pressable>
                        </View>

                        {/* --- SCROLLABLE CONTENT --- */}
                        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
                            {/* Context (if reaction) - with CLICKABLE username */}
                            {isReaction && !isOwnReaction && (
                                <View style={styles.contextRow}>
                                    <Ionicons name="return-down-forward" size={fp(14)} color={theme.textTertiary} />
                                    <Text style={[styles.contextText, { color: theme.textSecondary }]}>
                                        Reacted to{' '}
                                    </Text>
                                    {/* CLICKABLE USERNAME */}
                                    <Pressable 
                                        onPress={() => console.log('Navigate to profile:', item.reaction.targetAuthor.name)}
                                        style={({pressed}) => pressed && {opacity: 0.7}}
                                    >
                                        <Text style={[styles.targetAuthor, { color: theme.primary }]}>
                                            @{item.reaction.targetAuthor.name}
                                        </Text>
                                    </Pressable>
                                    <Text style={[styles.contextText, { color: theme.textSecondary }]}>'s post</Text>
                                </View>
                            )}

                            {/* Clickable Title (Opens Recipe) */}
                            <Pressable 
                                onPress={() => onTitlePress(item)}
                                style={({pressed}) => [styles.titleContainer, pressed && {opacity: 0.7}]}
                            >
                                <Text style={[styles.title, { color: theme.textPrimary }]}>
                                    {displayTitle}
                                </Text>
                                <Ionicons name="chevron-forward" size={fp(16)} color={theme.primary} />
                            </Pressable>

                            {/* Body Text */}
                            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                                {displayText}
                            </Text>
                        </ScrollView>

                        {/* --- ENGAGEMENT FOOTER --- */}
                        <View style={[styles.footer, { borderTopColor: theme.border }]}>
                            <View style={styles.footerLeft}>
                                {/* LIKE BUTTON */}
                                <Pressable 
                                    onPress={() => onLike(item.id)}
                                    style={({pressed}) => [styles.actionButton, pressed && styles.actionPressed]}
                                >
                                    <Ionicons 
                                        name={item.liked ? "heart" : "heart-outline"} 
                                        size={fp(24)} 
                                        color={item.liked ? theme.likeColor : theme.textPrimary} 
                                    />
                                    <Text style={[styles.actionText, { color: theme.textSecondary }]}>
                                        {item.likes}
                                    </Text>
                                </Pressable>

                                {/* COMMENT BUTTON */}
                                <Pressable 
                                    onPress={() => onComment(item)}
                                    style={({pressed}) => [styles.actionButton, pressed && styles.actionPressed]}
                                >
                                    <Ionicons name="chatbubble-outline" size={fp(22)} color={theme.textPrimary} />
                                    <Text style={[styles.actionText, { color: theme.textSecondary }]}>
                                        {item.comments}
                                    </Text>
                                </Pressable>
                            </View>

                            {/* SAVE BUTTON */}
                            <Pressable 
                                onPress={() => onSave(item.id)}
                                style={({pressed}) => [styles.actionButton, pressed && styles.actionPressed]}
                            >
                                <Ionicons 
                                    name={item.saved ? "bookmark" : "bookmark-outline"} 
                                    size={fp(22)} 
                                    color={item.saved ? theme.saveColor : theme.textPrimary} 
                                />
                            </Pressable>
                        </View>

                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.screenPadding,
    },
    cardContainer: {
        width: '100%',
        maxHeight: hp(500),
        borderRadius: wp(24),
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: wp(16),
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(12),
    },
    avatar: {
        width: wp(40),
        height: wp(40),
        borderRadius: wp(20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: fp(14),
    },
    chefName: {
        fontSize: fp(16),
        fontWeight: '700',
    },
    timestamp: {
        fontSize: fp(12),
    },
    closeButton: {
        padding: wp(4),
    },
    contentScroll: {
        padding: wp(20),
    },
    contextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: hp(12),
    },
    contextText: {
        fontSize: fp(13),
        marginLeft: wp(4),
    },
    targetAuthor: {
        fontSize: fp(13),
        fontWeight: '600',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(8),
        marginBottom: hp(12),
    },
    title: {
        fontSize: fp(18),
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    bodyText: {
        fontSize: fp(15),
        lineHeight: fp(22),
        marginBottom: hp(20),
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(20),
        paddingVertical: hp(16),
        borderTopWidth: 1,
    },
    footerLeft: {
        flexDirection: 'row',
        gap: wp(24),
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(6),
    },
    actionPressed: {
        opacity: 0.6,
    },
    actionText: {
        fontSize: fp(14),
        fontWeight: '600',
    },
});