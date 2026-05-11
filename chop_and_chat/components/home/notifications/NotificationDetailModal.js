import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Modal, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCloudinaryUrl } from '../../../utils/cloudinaryUrl';
import { wp, hp, fp } from '../../../utils/responsive';
import { NOTIFICATION_TYPES } from '../../../context/NotificationsContext';

export default function NotificationDetailModal({ 
    visible, 
    onClose, 
    notification, 
    theme, 
    currentUser,
    onClaim,
    claiming 
}) {
    const [dishImageFailed, setDishImageFailed] = useState(false);

    if (!notification) return null;

    const isChefRequest = notification.type === NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST;
    const isReviewReceived = notification.type === NOTIFICATION_TYPES.CHEF_REVIEW_RECEIVED;

    const requestStatus = notification.data?.requestStatus;
    const claimedBy = notification.data?.claimedBy;
    const isClaimedByMe = claimedBy === currentUser?.id;
    const isClaimedByOther = claimedBy && !isClaimedByMe;
    const isCompleted = requestStatus === 'completed';
    const isStillClaimable = isChefRequest && !isClaimedByOther && !isCompleted;

    return (
        <Modal visible={visible} transparent={true} animationType='slide' onRequestClose={onClose}>
            <View style={[styles.modalOverlay, { backgroundColor: theme.overlayBackground }]}>
                <View style={[styles.detailModalContainer, { backgroundColor: theme.modalBackground }]}>
                    
                    <View style={[styles.detailHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>
                            {isChefRequest ? 'Review Request' : 'Chef Review'}
                        </Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={fp(24)} color={theme.textPrimary} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.detailContent}>
                        {/* Requester/Chef Info */}
                        <View style={styles.infoRow}>
                            <View style={[styles.avatar, { backgroundColor: isChefRequest ? '#10B981' : theme.primary }]}>
                                <Text style={styles.avatarText}>
                                    {(isChefRequest ? notification.data?.requesterName?.[0] : notification.data?.chefName?.[0]) || 'U'}
                                </Text>
                            </View>
                            <View style={styles.details}>
                                <Text style={[styles.name, { color: theme.textPrimary }]}>
                                    {isChefRequest
                                        ? (notification.data?.requesterName || '—')
                                        : (notification.data?.chefName || '—')}
                                </Text>
                                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                                    {isChefRequest ? 'Wants your expert feedback' : 'Professional Chef'}
                                </Text>
                            </View>
                        </View>

                        {/* Post Info */}
                        <View style={[styles.postCard, { backgroundColor: theme.cardBackgroundAlt }]}>
                            {isReviewReceived && <Ionicons name="restaurant" size={fp(20)} color={theme.primary} />}
                            <Text style={[styles.postTitle, { color: theme.textPrimary }]}>
                                {isChefRequest
                                    ? `Dish: ${notification.data?.postTitle || '—'}`
                                    : (notification.data?.postTitle || 'Your Dish')}
                            </Text>
                        </View>

                        {/* Dish image — always rendered for chef review requests so the slot is
                            never invisible; shows a placeholder when the URL is missing or broken */}
                        {isChefRequest && (
                            <View style={[styles.dishImageContainer, { backgroundColor: theme.cardBackgroundAlt }]}>
                                {notification.data?.postImage && !dishImageFailed ? (
                                    <Image
                                        source={{ uri: getCloudinaryUrl(notification.data.postImage, { width: 600, quality: 'auto', format: 'auto' }) }}
                                        style={styles.dishImage}
                                        resizeMode="cover"
                                        onError={() => setDishImageFailed(true)}
                                    />
                                ) : (
                                    <View style={styles.dishImagePlaceholder}>
                                        <Ionicons name="camera-outline" size={fp(36)} color={theme.textTertiary} />
                                        <Text style={[styles.dishImagePlaceholderText, { color: theme.textTertiary }]}>
                                            No photo provided
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Content */}
                        {isChefRequest && notification.data?.context && (
                            <View style={[styles.contextBox, { backgroundColor: theme.primaryLightest }]}>
                                <Text style={[styles.contextText, { color: theme.textPrimary }]}>
                                    "{notification.data.context}"
                                </Text>
                            </View>
                        )}

                        {isReviewReceived && (
                            <>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Chef's Feedback:</Text>
                                <View style={[styles.messageBox, { backgroundColor: theme.primaryLightest }]}>
                                    <Text style={[styles.message, { color: theme.textPrimary }]}>
                                        {notification.subtitle}
                                    </Text>
                                </View>
                            </>
                        )}

                        {isChefRequest && (
                            <>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Note:</Text>
                                <Text style={[styles.message, { color: theme.textPrimary, marginBottom: hp(20) }]}>
                                    By claiming this request, other chefs will no longer see it. You'll be expected to provide professional feedback.
                                </Text>
                            </>
                        )}
                    </ScrollView>

                    <View style={styles.actionButtonsRow}>
                        {isChefRequest ? (
                            isClaimedByOther || isCompleted ? (
                                <View style={[styles.claimedBanner, { backgroundColor: theme.cardBackgroundAlt }]}>
                                    <Ionicons name="lock-closed-outline" size={fp(16)} color={theme.textTertiary} />
                                    <Text style={[styles.claimedBannerText, { color: theme.textTertiary }]}>
                                        {isCompleted ? 'This request has been completed' : 'Already claimed by another chef'}
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <Pressable
                                        onPress={onClose}
                                        style={[styles.cancelButton, { backgroundColor: theme.cardBackgroundAlt }]}
                                    >
                                        <Text style={[styles.cancelButtonText, { color: theme.textMuted }]}>Later</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={onClaim}
                                        style={[styles.actionButton, { backgroundColor: theme.primary }]}
                                        disabled={claiming}
                                    >
                                        {claiming ? <ActivityIndicator color="#FFF" /> : (
                                            <>
                                                <Ionicons
                                                    name={isClaimedByMe ? "pencil" : "checkbox"}
                                                    size={fp(18)}
                                                    color="#FFF"
                                                />
                                                <Text style={styles.actionButtonText}>
                                                    {isClaimedByMe ? 'Review Now' : 'Claim & Review'}
                                                </Text>
                                            </>
                                        )}
                                    </Pressable>
                                </>
                            )
                        ) : (
                            <Pressable onPress={onClose} style={[styles.fullWidthButton, { backgroundColor: theme.primary }]}>
                                <Text style={styles.fullWidthButtonText}>Close</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    detailModalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: wp(24),
        borderTopRightRadius: wp(24),
        maxHeight: '90%',
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(20),
        paddingVertical: hp(16),
        borderBottomWidth: 1,
    },
    detailTitle: {
        fontSize: fp(20),
        fontWeight: '700',
    },
    detailContent: {
        padding: wp(20),
        maxHeight: hp(500),
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(20),
    },
    avatar: {
        width: wp(48),
        height: wp(48),
        borderRadius: wp(24),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(12),
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: fp(16),
        fontWeight: '700',
    },
    details: {
        flex: 1,
    },
    name: {
        fontSize: fp(17),
        fontWeight: '700',
    },
    subtitle: {
        fontSize: fp(13),
        marginTop: hp(2),
    },
    postCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(10),
        padding: wp(14),
        borderRadius: wp(12),
        marginBottom: hp(16),
    },
    postTitle: {
        fontSize: fp(15),
        fontWeight: '600',
        flex: 1,
    },
    label: {
        fontSize: fp(13),
        fontWeight: '500',
        marginBottom: hp(8),
    },
    messageBox: {
        padding: wp(16),
        borderRadius: wp(12),
        marginBottom: hp(16),
    },
    message: {
        fontSize: fp(14),
        lineHeight: hp(22),
    },
    dishImageContainer: {
        borderRadius: wp(12),
        overflow: 'hidden',
        marginBottom: hp(16),
        minHeight: hp(160),
    },
    dishImage: {
        width: '100%',
        height: hp(200),
    },
    dishImagePlaceholder: {
        width: '100%',
        height: hp(160),
        justifyContent: 'center',
        alignItems: 'center',
        gap: hp(8),
    },
    dishImagePlaceholderText: {
        fontSize: fp(13),
        fontWeight: '500',
    },
    contextBox: {
        padding: wp(14),
        borderRadius: wp(12),
        marginBottom: hp(16),
    },
    contextText: {
        fontSize: fp(13),
        lineHeight: hp(20),
        fontStyle: 'italic',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: wp(12),
        padding: wp(20),
        paddingTop: hp(12),
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
    },
    claimedBanner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(8),
        paddingVertical: hp(14),
        borderRadius: wp(12),
    },
    claimedBannerText: {
        fontSize: fp(14),
        fontWeight: '500',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: hp(14),
        borderRadius: wp(12),
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: fp(16),
        fontWeight: '600',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(8),
        paddingVertical: hp(14),
        borderRadius: wp(12),
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: fp(16),
        fontWeight: '700',
    },
    fullWidthButton: {
        flex: 1,
        paddingVertical: hp(14),
        borderRadius: wp(12),
        alignItems: 'center',
    },
    fullWidthButtonText: {
        color: '#FFFFFF',
        fontSize: fp(16),
        fontWeight: '600',
    },
});
