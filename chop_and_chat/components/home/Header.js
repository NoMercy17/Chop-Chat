import { Text, View, StyleSheet, Pressable, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback, useRef } from 'react';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications, NOTIFICATION_TYPES } from '../../context/NotificationsContext';

export default function Header({ navigation }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [postPreviewExpanded, setPostPreviewExpanded] = useState(false);
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();
    
    const { theme } = useTheme();
    const { 
        notifications, 
        unreadCount, 
        currentUser,
        markAsRead, 
        deleteNotification,
        claimReviewRequest,
        submitChefReview,
        cancelReviewClaim,
    } = useNotifications();

    const handleNotificationPress = useCallback((notification) => {
        markAsRead(notification.id);
        setSelectedNotification(notification);
        
        if (notification.type === NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST) {
            // For chefs - close notifications list and show the review request detail in pageSheet
            setModalVisible(false);
            // Use requestAnimationFrame to ensure state updates are processed before showing modal
            requestAnimationFrame(() => {
                setDetailModalVisible(true);
            });
        } else if (notification.type === NOTIFICATION_TYPES.CHEF_REVIEW_RECEIVED) {
            // For users - show the received review
            setDetailModalVisible(true);
        } else {
            // For simple notifications (followers, likes), just mark as read
            // Could navigate to relevant screen in future
        }
    }, [markAsRead]);

    const handleDeleteNotification = useCallback((e, notificationId) => {
        e.stopPropagation();
        deleteNotification(notificationId);
    }, [deleteNotification]);

    const handleClaimReview = useCallback(() => {
        if (selectedNotification) {
            claimReviewRequest(selectedNotification.id, currentUser.id);
            setDetailModalVisible(false);
            setReviewModalVisible(true);
        }
    }, [selectedNotification, claimReviewRequest, currentUser.id]);

    const handleCancelReview = useCallback(() => {
        setDetailModalVisible(false);
        setReviewModalVisible(false);
        setSelectedNotification(null);
        setReviewText('');
        setPostPreviewExpanded(false);
        rotateAnim.setValue(0);
    }, [rotateAnim]);

    const handleSubmitReview = useCallback(() => {
        if (reviewText.trim() && selectedNotification) {
            submitChefReview(selectedNotification.id, reviewText.trim());
            setReviewText('');
            setReviewModalVisible(false);
            setSelectedNotification(null);
            setPostPreviewExpanded(false);
            rotateAnim.setValue(0);
        }
    }, [reviewText, selectedNotification, submitChefReview, rotateAnim]);

    const handleCancelWriteReview = useCallback(() => {
        cancelReviewClaim(selectedNotification?.id);
        setReviewText('');
        setReviewModalVisible(false);
        setSelectedNotification(null);
        setPostPreviewExpanded(false);
        rotateAnim.setValue(0);
    }, [selectedNotification, cancelReviewClaim, rotateAnim]);

    const togglePostPreview = useCallback(() => {
        const toValue = postPreviewExpanded ? 0 : 1;
        Animated.timing(rotateAnim, {
            toValue,
            duration: 300,
            useNativeDriver: true,
        }).start();
        setPostPreviewExpanded(!postPreviewExpanded);
    }, [postPreviewExpanded, rotateAnim]);

    const arrowRotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    // Get notification icon based on type
    const getNotificationIcon = (type) => {
        switch (type) {
            case NOTIFICATION_TYPES.NEW_FOLLOWER:
                return 'person-add';
            case NOTIFICATION_TYPES.POST_LIKES:
                return 'heart';
            case NOTIFICATION_TYPES.CHEF_REVIEW_RECEIVED:
                return 'star';
            case NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST:
                return 'restaurant';
            default:
                return 'notifications';
        }
    };

    // Get notification icon color based on type
    const getNotificationIconColor = (type) => {
        switch (type) {
            case NOTIFICATION_TYPES.NEW_FOLLOWER:
                return '#3B82F6';
            case NOTIFICATION_TYPES.POST_LIKES:
                return '#EF4444';
            case NOTIFICATION_TYPES.CHEF_REVIEW_RECEIVED:
                return '#F59E0B';
            case NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST:
                return '#10B981';
            default:
                return theme.primary;
        }
    };

    // Filter out claimed notifications (unless claimed by current user)
    const visibleNotifications = notifications.filter(n => {
        if (n.type === NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST && n.claimedBy) {
            return n.claimedBy === currentUser.id;
        }
        return true;
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.primary }]}>
            <Text style={[styles.appName, { color: theme.textInverse }]}>Cook&Chat</Text>

            <View style={styles.rightButtons}>
                <Pressable 
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="notifications" size={fp(22)} color={theme.textInverse} />
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                        </View>
                    )}
                </Pressable>

                <Pressable 
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Ionicons name="person" size={fp(22)} color={theme.textInverse} />
                </Pressable>
            </View>

            {/* Notifications List Modal */}
            <Modal visible={modalVisible} transparent={true} animationType='slide'>
                <View style={[styles.modalOverlay, { backgroundColor: theme.overlayBackground }]}>
                    <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.borderLight }]}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Notifications</Text>
                        </View>
                        
                        <ScrollView 
                            style={styles.notificationList}
                            showsVerticalScrollIndicator={false}
                        >
                            {visibleNotifications.length > 0 ? visibleNotifications.map((notif) => (
                                <Pressable
                                    key={notif.id}
                                    style={({ pressed }) => [
                                        styles.notificationItem,
                                        { backgroundColor: theme.cardBackgroundAlt, borderColor: theme.borderLight },
                                        notif.unread && [styles.notificationUnread, { backgroundColor: theme.primaryLightest, borderColor: theme.primaryLighter }],
                                        notif.type === NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST && styles.claimableNotification,
                                        pressed && styles.notificationPressed
                                    ]}
                                    onPress={() => handleNotificationPress(notif)}
                                >
                                    {/* Icon */}
                                    <View style={[styles.notificationIcon, { backgroundColor: getNotificationIconColor(notif.type) + '20' }]}>
                                        <Ionicons 
                                            name={getNotificationIcon(notif.type)} 
                                            size={fp(18)} 
                                            color={getNotificationIconColor(notif.type)} 
                                        />
                                    </View>

                                    {/* Content */}
                                    <View style={styles.notificationContent}>
                                        <View style={styles.notificationHeader}>
                                            <Text style={[styles.notificationTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                                                {notif.title}
                                            </Text>
                                            <Text style={[styles.notificationTime, { color: theme.textTertiary }]}>{notif.time}</Text>
                                        </View>
                                        <Text style={[styles.notificationSubtitle, { color: theme.textSecondary }]} numberOfLines={2}>
                                            {notif.subtitle}
                                        </Text>
                                        {notif.type === NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST && (
                                            <View style={styles.tapToReviewHint}>
                                                <Ionicons name="hand-left" size={fp(12)} color={theme.primary} />
                                                <Text style={[styles.tapToReviewText, { color: theme.primary }]}>Tap to review</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Delete button */}
                                    <Pressable 
                                        style={styles.deleteButton}
                                        onPress={(e) => handleDeleteNotification(e, notif.id)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="close" size={fp(18)} color={theme.textTertiary} />
                                    </Pressable>
                                </Pressable>
                            )) : (
                                <View style={styles.emptyState}>
                                    <Ionicons name="notifications-off-outline" size={fp(48)} color={theme.textTertiary} />
                                    <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No notifications yet</Text>
                                </View>
                            )}
                        </ScrollView>

                        <Pressable 
                            onPress={() => setModalVisible(false)} 
                            style={({ pressed }) => [
                                styles.closeButton,
                                { backgroundColor: theme.background },
                                pressed && styles.closeButtonPressed
                            ]}
                        >
                            <Text style={[styles.closeButtonText, { color: theme.textMuted }]}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Detail Modal (for viewing chef reviews) */}
            <Modal visible={detailModalVisible && selectedNotification?.type === NOTIFICATION_TYPES.CHEF_REVIEW_RECEIVED} transparent={true} animationType='slide'>
                <View style={[styles.modalOverlay, { backgroundColor: theme.overlayBackground }]}>
                    <View style={[styles.detailModalContainer, { backgroundColor: theme.modalBackground }]}>
                        {selectedNotification?.type === NOTIFICATION_TYPES.CHEF_REVIEW_RECEIVED && (
                            <>
                                {/* Chef Review Received View */}
                                <View style={[styles.detailHeader, { borderBottomColor: theme.border }]}>
                                    <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>Chef Review</Text>
                                    <Pressable onPress={() => setDetailModalVisible(false)}>
                                        <Ionicons name="close" size={fp(24)} color={theme.textPrimary} />
                                    </Pressable>
                                </View>

                                <ScrollView 
                                    style={styles.detailContent}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {/* Chef Info */}
                                    <View style={styles.chefInfoRow}>
                                        <View style={[styles.chefAvatar, { backgroundColor: theme.primary }]}>
                                            <Text style={styles.chefAvatarText}>{selectedNotification?.data?.chefAvatar}</Text>
                                        </View>
                                        <View style={styles.chefDetails}>
                                            <Text style={[styles.chefName, { color: theme.textPrimary }]}>
                                                {selectedNotification?.data?.chefName}
                                            </Text>
                                            <View style={styles.ratingRow}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Ionicons 
                                                        key={star}
                                                        name={star <= (selectedNotification?.data?.rating || 0) ? 'star' : 'star-outline'}
                                                        size={fp(16)}
                                                        color="#F59E0B"
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                    </View>

                                    {/* Reviewed Post */}
                                    <View style={[styles.reviewedPostCard, { backgroundColor: theme.cardBackgroundAlt }]}>
                                        <Ionicons name="restaurant" size={fp(20)} color={theme.primary} />
                                        <Text style={[styles.reviewedPostTitle, { color: theme.textPrimary }]}>
                                            {selectedNotification?.data?.postTitle}
                                        </Text>
                                    </View>

                                    {/* Review Message */}
                                    <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Review Message:</Text>
                                    <View style={[styles.reviewMessageBox, { backgroundColor: theme.cardBackgroundAlt }]}>
                                        <Text style={[styles.reviewMessage, { color: theme.textPrimary }]}>
                                            {selectedNotification?.data?.reviewMessage}
                                        </Text>
                                    </View>
                                </ScrollView>

                                <Pressable 
                                    onPress={() => setDetailModalVisible(false)} 
                                    style={({ pressed }) => [
                                        styles.closeButton,
                                        { backgroundColor: theme.background },
                                        pressed && styles.closeButtonPressed
                                    ]}
                                >
                                    <Text style={[styles.closeButtonText, { color: theme.textMuted }]}>Close</Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Review Request Modal (pageSheet style for chefs) */}
            <Modal 
                visible={detailModalVisible && selectedNotification?.type === NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST} 
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleCancelReview}
            >
                <View style={[styles.pageSheetContainer, { backgroundColor: theme.screenBackground }]}>
                    {/* Header with close button */}
                    <View style={styles.pageSheetHeader}>
                        <Pressable
                            onPress={handleCancelReview}
                            style={({ pressed }) => [
                                styles.pageSheetCloseButton,
                                pressed && styles.closeButtonPressed
                            ]}
                        >
                            <Ionicons name="close" size={fp(24)} color={theme.textPrimary} />
                        </Pressable>
                    </View>

                    <ScrollView 
                        style={styles.pageSheetScrollContainer}
                        contentContainerStyle={styles.pageSheetScrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Requester Info */}
                        <View style={styles.requesterInfoCard}>
                            <View style={[styles.requesterAvatar, { backgroundColor: '#10B981' }]}>
                                <Text style={styles.requesterAvatarText}>{selectedNotification?.data?.requesterAvatar}</Text>
                            </View>
                            <View style={styles.requesterDetails}>
                                <Text style={[styles.requesterName, { color: theme.textPrimary }]}>
                                    {selectedNotification?.data?.requesterName}
                                </Text>
                                <Text style={[styles.requesterSubtitle, { color: theme.textSecondary }]}>
                                    Wants your expert feedback
                                </Text>
                            </View>
                        </View>

                        {/* Dish Title */}
                        <Text style={[styles.pageSheetTitle, { color: theme.textPrimary }]}>
                            {selectedNotification?.data?.postTitle}
                        </Text>

                        {/* Description */}
                        <Text style={[styles.pageSheetDescription, { color: theme.textSecondary }]}>
                            {selectedNotification?.data?.postDescription}
                        </Text>

                        {/* Dish Image */}
                        {selectedNotification?.data?.postImage ? (
                            <Image 
                                source={{ uri: selectedNotification.data.postImage }} 
                                style={styles.pageSheetDishImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.pageSheetImagePlaceholder, { backgroundColor: theme.imageBackground }]}>
                                <Ionicons name="image-outline" size={fp(48)} color={theme.textTertiary} />
                                <Text style={[styles.pageSheetImagePlaceholderText, { color: theme.textTertiary }]}>
                                    Dish Photo
                                </Text>
                            </View>
                        )}

                        {/* Context from requester */}
                        <View style={[styles.contextBox, { backgroundColor: theme.primaryLightest }]}>
                            <Ionicons name="chatbubble-ellipses" size={fp(18)} color={theme.primary} />
                            <Text style={[styles.contextText, { color: theme.textPrimary }]}>
                                "{selectedNotification?.data?.context}"
                            </Text>
                        </View>

                        {/* Divider */}
                        <View style={[styles.pageSheetDivider, { backgroundColor: theme.textSecondary, opacity: 0.2 }]} />

                        {/* Dish Meta (time + difficulty) */}
                        <View style={styles.pageSheetMetaRow}>
                            <View style={styles.pageSheetMetaItem}>
                                <Ionicons name="time-outline" size={fp(16)} color={theme.textSecondary} />
                                <Text style={[styles.pageSheetMetaText, { color: theme.textSecondary }]}>
                                    {selectedNotification?.data?.cookTime}
                                </Text>
                            </View>
                            <View style={[
                                styles.pageSheetDifficultyBadge, 
                                { backgroundColor: selectedNotification?.data?.difficulty === 'Hard' ? '#EF444420' : selectedNotification?.data?.difficulty === 'Medium' ? '#F59E0B20' : '#10B98120' }
                            ]}>
                                <Text style={[
                                    styles.pageSheetDifficultyText, 
                                    { color: selectedNotification?.data?.difficulty === 'Hard' ? '#EF4444' : selectedNotification?.data?.difficulty === 'Medium' ? '#F59E0B' : '#10B981' }
                                ]}>
                                    {selectedNotification?.data?.difficulty}
                                </Text>
                            </View>
                        </View>

                        {/* Ingredients */}
                        <Text style={[styles.pageSheetSectionTitle, { color: theme.textPrimary }]}>Ingredients</Text>
                        {selectedNotification?.data?.ingredients?.map((ingredient, index) => (
                            <View key={index} style={styles.pageSheetIngredientRow}>
                                <View style={[styles.pageSheetIngredientBullet, { backgroundColor: theme.primary }]} />
                                <Text style={[styles.pageSheetIngredientText, { color: theme.textPrimary }]}>{ingredient}</Text>
                            </View>
                        ))}

                        {/* Instructions */}
                        <Text style={[styles.pageSheetSectionTitle, { color: theme.textPrimary }]}>Instructions</Text>
                        <Text style={[styles.pageSheetInstructionsText, { color: theme.textPrimary }]}>
                            {selectedNotification?.data?.instructions}
                        </Text>

                        {/* Tools */}
                        <Text style={[styles.pageSheetSectionTitle, { color: theme.textPrimary }]}>Tools Used</Text>
                        <View style={styles.pageSheetToolsRow}>
                            {selectedNotification?.data?.utensils?.map((tool, index) => (
                                <View key={index} style={[styles.pageSheetToolBadge, { backgroundColor: theme.cardBackgroundAlt }]}>
                                    <Text style={[styles.pageSheetToolText, { color: theme.textSecondary }]}>
                                        {tool.charAt(0).toUpperCase() + tool.slice(1)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={[styles.pageSheetActionButtons, { backgroundColor: theme.screenBackground }]}>
                        <Pressable 
                            onPress={handleCancelReview} 
                            style={({ pressed }) => [
                                styles.cancelReviewButton,
                                { backgroundColor: theme.cardBackgroundAlt },
                                pressed && styles.buttonPressed
                            ]}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.textMuted }]}>Cancel</Text>
                        </Pressable>
                        <Pressable 
                            onPress={handleClaimReview} 
                            style={({ pressed }) => [
                                styles.reviewButton,
                                pressed && styles.buttonPressed
                            ]}
                        >
                            <Ionicons name="create" size={fp(18)} color="#FFFFFF" />
                            <Text style={styles.reviewButtonText}>Review</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Write Review Modal (for chefs after claiming) */}
            <Modal visible={reviewModalVisible} transparent={true} animationType='slide'>
                <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={[styles.modalOverlay, { backgroundColor: theme.overlayBackground }]}>
                        <KeyboardAvoidingView 
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.keyboardAvoid}
                        >
                            <View style={[styles.writeReviewContainer, { 
                                backgroundColor: theme.modalBackground,
                                paddingBottom: insets.bottom,
                            }]}>
                                <View style={[styles.detailHeader, { borderBottomColor: theme.border }]}>
                                    <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>Write Your Review</Text>
                                    <Pressable onPress={handleCancelWriteReview}>
                                        <Ionicons name="close" size={fp(24)} color={theme.textPrimary} />
                                    </Pressable>
                                </View>

                                <ScrollView 
                                    style={styles.writeReviewScroll}
                                    contentContainerStyle={styles.writeReviewScrollContent}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {/* Expandable Dish Preview */}
                                    <Pressable 
                                        style={[styles.expandableDishPreview, { backgroundColor: theme.cardBackgroundAlt }]}
                                        onPress={togglePostPreview}
                                    >
                                        <Ionicons name="restaurant" size={fp(20)} color={theme.primary} />
                                        <Text style={[styles.expandableDishTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                                            {selectedNotification?.data?.postTitle}
                                        </Text>
                                        <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
                                            <Ionicons name="chevron-down" size={fp(20)} color={theme.textSecondary} />
                                        </Animated.View>
                                    </Pressable>

                                    {/* Expanded Post Details */}
                                    {postPreviewExpanded && (
                                        <View style={[styles.expandedPostDetails, { backgroundColor: theme.cardBackgroundAlt }]}>
                                            {/* Dish Image */}
                                            {selectedNotification?.data?.postImage ? (
                                                <Image 
                                                    source={{ uri: selectedNotification.data.postImage }} 
                                                    style={styles.expandedPostImage}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View style={[styles.expandedImagePlaceholder, { backgroundColor: theme.imageBackground }]}>
                                                    <Ionicons name="image-outline" size={fp(32)} color={theme.textTertiary} />
                                                </View>
                                            )}

                                            {/* Description */}
                                            <Text style={[styles.expandedPostDescription, { color: theme.textSecondary }]}>
                                                {selectedNotification?.data?.postDescription}
                                            </Text>

                                            {/* Context from requester */}
                                            <View style={[styles.expandedContextBox, { backgroundColor: theme.primaryLightest }]}>
                                                <Ionicons name="chatbubble-ellipses" size={fp(14)} color={theme.primary} />
                                                <Text style={[styles.expandedContextText, { color: theme.textPrimary }]}>
                                                    "{selectedNotification?.data?.context}"
                                                </Text>
                                            </View>

                                            {/* Quick meta info */}
                                            <View style={styles.expandedMetaRow}>
                                                <View style={styles.expandedMetaItem}>
                                                    <Ionicons name="time-outline" size={fp(14)} color={theme.textSecondary} />
                                                    <Text style={[styles.expandedMetaText, { color: theme.textSecondary }]}>
                                                        {selectedNotification?.data?.cookTime}
                                                    </Text>
                                                </View>
                                                <View style={[
                                                    styles.expandedDifficultyBadge, 
                                                    { backgroundColor: selectedNotification?.data?.difficulty === 'Hard' ? '#EF444420' : selectedNotification?.data?.difficulty === 'Medium' ? '#F59E0B20' : '#10B98120' }
                                                ]}>
                                                    <Text style={[
                                                        styles.expandedDifficultyText, 
                                                        { color: selectedNotification?.data?.difficulty === 'Hard' ? '#EF4444' : selectedNotification?.data?.difficulty === 'Medium' ? '#F59E0B' : '#10B981' }
                                                    ]}>
                                                        {selectedNotification?.data?.difficulty}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}

                                    <Text style={[styles.writeReviewLabel, { color: theme.textPrimary }]}>
                                        Share your expert feedback:
                                    </Text>

                                    <TextInput
                                        style={[styles.reviewTextInput, { 
                                            backgroundColor: theme.inputBackground, 
                                            color: theme.textPrimary,
                                            borderColor: theme.border 
                                        }]}
                                        placeholder="Provide detailed feedback on technique, presentation, flavor suggestions, and areas for improvement..."
                                        placeholderTextColor={theme.textTertiary}
                                        multiline
                                        numberOfLines={8}
                                        textAlignVertical="top"
                                        value={reviewText}
                                        onChangeText={setReviewText}
                                    />

                                    <Text style={[styles.characterCount, { color: theme.textTertiary }]}>
                                        {reviewText.length} characters
                                    </Text>
                                </ScrollView>

                                <View style={styles.actionButtonsRow}>
                                    <Pressable 
                                        onPress={handleCancelWriteReview} 
                                        style={({ pressed }) => [
                                            styles.cancelReviewButton,
                                            { backgroundColor: theme.background },
                                            pressed && styles.buttonPressed
                                        ]}
                                    >
                                        <Text style={[styles.cancelButtonText, { color: theme.textMuted }]}>Cancel</Text>
                                    </Pressable>
                                    <Pressable 
                                        onPress={handleSubmitReview} 
                                        style={({ pressed }) => [
                                            styles.submitReviewButton,
                                            !reviewText.trim() && styles.submitButtonDisabled,
                                            pressed && reviewText.trim() && styles.buttonPressed
                                        ]}
                                        disabled={!reviewText.trim()}
                                    >
                                        <Ionicons name="send" size={fp(18)} color="#FFFFFF" />
                                        <Text style={styles.submitButtonText}>Send Review</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.screenPadding,
        paddingVertical: hp(8),
    },
    appName: {
        fontSize: fp(24),
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.5,
    },
    rightButtons: {
        flexDirection: 'row',
        gap: wp(8),
    },
    button: {
        width: wp(36),
        height: wp(36),
        borderRadius: wp(10),
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.96 }],
    },
    badge: {
        position: 'absolute',
        top: -hp(2),
        right: -wp(2),
        backgroundColor: '#EF4444',
        borderRadius: wp(10),
        minWidth: wp(18),
        height: wp(18),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(4),
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: fp(10),
        fontWeight: '700',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: wp(24),
        borderTopRightRadius: wp(24),
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(-4) },
        shadowOpacity: 0.1,
        shadowRadius: wp(12),
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(24),
        paddingTop: hp(24),
        paddingBottom: hp(16),
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: fp(28),
        fontWeight: '700',
        color: '#111827',
    },
    chefBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(4),
        backgroundColor: '#FEF3C7',
        paddingHorizontal: wp(10),
        paddingVertical: hp(4),
        borderRadius: wp(12),
    },
    chefBadgeText: {
        fontSize: fp(12),
        fontWeight: '600',
        color: '#D97706',
    },

    // Notification List
    notificationList: {
        paddingHorizontal: wp(20),
        paddingTop: hp(12),
    },
    notificationItem: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        padding: wp(14),
        borderRadius: wp(16),
        marginBottom: hp(10),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    notificationUnread: {
        backgroundColor: '#EFF6FF',
        borderColor: '#DBEAFE',
    },
    claimableNotification: {
        borderLeftWidth: 3,
        borderLeftColor: '#10B981',
    },
    notificationPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    notificationIcon: {
        width: wp(40),
        height: wp(40),
        borderRadius: wp(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(12),
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(4),
    },
    notificationTitle: {
        fontSize: fp(15),
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    notificationTime: {
        fontSize: fp(11),
        color: '#9CA3AF',
        fontWeight: '500',
        marginLeft: wp(8),
    },
    notificationSubtitle: {
        fontSize: fp(13),
        color: '#6B7280',
        lineHeight: hp(18),
    },
    tapToReviewHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(4),
        marginTop: hp(6),
    },
    tapToReviewText: {
        fontSize: fp(11),
        fontWeight: '600',
    },
    deleteButton: {
        padding: wp(6),
        marginLeft: wp(8),
    },
    unreadDot: {
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
        backgroundColor: '#3b83f6c2',
        marginLeft: wp(4),
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: hp(60),
    },
    emptyStateText: {
        fontSize: fp(16),
        marginTop: hp(12),
    },

    // Close Button
    closeButton: {
        margin: wp(20),
        marginTop: hp(12),
        paddingVertical: hp(14),
        backgroundColor: '#F3F4F6',
        borderRadius: wp(12),
        alignItems: 'center',
    },
    closeButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    closeButtonText: {
        color: '#374151',
        fontSize: fp(16),
        fontWeight: '600',
    },

    // Detail Modal
    detailModalContainer: {
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
    chefInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(20),
    },
    chefAvatar: {
        width: wp(48),
        height: wp(48),
        borderRadius: wp(24),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(12),
    },
    chefAvatarText: {
        color: '#FFFFFF',
        fontSize: fp(16),
        fontWeight: '700',
    },
    chefDetails: {
        flex: 1,
    },
    chefName: {
        fontSize: fp(17),
        fontWeight: '700',
    },
    ratingRow: {
        flexDirection: 'row',
        marginTop: hp(4),
    },
    requestSubtitle: {
        fontSize: fp(13),
        marginTop: hp(2),
    },
    reviewedPostCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(10),
        padding: wp(14),
        borderRadius: wp(12),
        marginBottom: hp(16),
    },
    reviewedPostTitle: {
        fontSize: fp(15),
        fontWeight: '600',
        flex: 1,
    },
    reviewLabel: {
        fontSize: fp(13),
        fontWeight: '500',
        marginBottom: hp(8),
    },
    reviewMessageBox: {
        padding: wp(16),
        borderRadius: wp(12),
        marginBottom: hp(16),
    },
    reviewMessage: {
        fontSize: fp(14),
        lineHeight: hp(22),
    },

    // Review Request Styles
    sectionLabel: {
        fontSize: fp(18),
        fontWeight: '700',
        marginBottom: hp(6),
    },
    dishDescription: {
        fontSize: fp(14),
        lineHeight: hp(20),
        marginBottom: hp(16),
    },
    contextBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: wp(10),
        padding: wp(14),
        borderRadius: wp(12),
        marginBottom: hp(16),
    },
    contextText: {
        flex: 1,
        fontSize: fp(13),
        lineHeight: hp(20),
        fontStyle: 'italic',
    },
    dishMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(16),
        marginBottom: hp(20),
    },
    dishMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(6),
    },
    dishMetaText: {
        fontSize: fp(14),
    },
    difficultyBadge: {
        paddingHorizontal: wp(10),
        paddingVertical: hp(4),
        borderRadius: wp(8),
    },
    difficultyText: {
        fontSize: fp(12),
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: fp(16),
        fontWeight: '700',
        marginBottom: hp(10),
        marginTop: hp(8),
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(8),
    },
    ingredientBullet: {
        width: wp(6),
        height: wp(6),
        borderRadius: wp(3),
        marginRight: wp(10),
    },
    ingredientText: {
        fontSize: fp(14),
        flex: 1,
    },
    instructionsText: {
        fontSize: fp(14),
        lineHeight: hp(22),
        marginBottom: hp(16),
    },
    toolsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(8),
        marginBottom: hp(20),
    },
    toolBadge: {
        paddingHorizontal: wp(12),
        paddingVertical: hp(6),
        borderRadius: wp(8),
    },
    toolText: {
        fontSize: fp(13),
        fontWeight: '500',
    },

    // Action Buttons
    actionButtonsRow: {
        flexDirection: 'row',
        gap: wp(12),
        padding: wp(20),
        paddingTop: hp(12),
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
    },
    cancelReviewButton: {
        flex: 1,
        paddingVertical: hp(14),
        borderRadius: wp(12),
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: fp(16),
        fontWeight: '600',
    },
    reviewButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(8),
        paddingVertical: hp(14),
        borderRadius: wp(12),
        backgroundColor: '#10B981',
    },
    reviewButtonText: {
        color: '#FFFFFF',
        fontSize: fp(16),
        fontWeight: '700',
    },

    // Write Review Modal
    keyboardAvoid: {
        width: '100%',
        justifyContent: 'flex-end',
        flex: 1,
    },
    writeReviewContainer: {
        borderTopLeftRadius: wp(24),
        borderTopRightRadius: wp(24),
        flex: 1,
        maxHeight: '85%',
        display: 'flex',
        flexDirection: 'column',
    },
    writeReviewScroll: {
        flex: 1,
    },
    writeReviewContent: {
        padding: wp(20),
    },
    writeReviewLabel: {
        fontSize: fp(15),
        fontWeight: '600',
        marginBottom: hp(12),
    },
    reviewTextInput: {
        borderWidth: 1,
        borderRadius: wp(12),
        padding: wp(14),
        fontSize: fp(14),
        minHeight: hp(180),
        lineHeight: hp(22),
    },
    characterCount: {
        fontSize: fp(12),
        textAlign: 'right',
        marginTop: hp(8),
    },
    submitReviewButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(8),
        paddingVertical: hp(14),
        borderRadius: wp(12),
        backgroundColor: '#2563EB',
    },
    submitButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: fp(16),
        fontWeight: '700',
    },

    // PageSheet Modal Styles (for review requests)
    pageSheetContainer: {
        flex: 1,
    },
    pageSheetHeader: {
        paddingTop: hp(12),
        paddingHorizontal: wp(16),
        paddingBottom: hp(8),
    },
    pageSheetCloseButton: {
        width: wp(36),
        height: wp(36),
        borderRadius: wp(18),
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageSheetScrollContainer: {
        flex: 1,
    },
    pageSheetScrollContent: {
        padding: wp(20),
        paddingBottom: hp(20),
    },
    requesterInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(24),
    },
    requesterAvatar: {
        width: wp(52),
        height: wp(52),
        borderRadius: wp(26),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(14),
    },
    requesterAvatarText: {
        color: '#FFFFFF',
        fontSize: fp(18),
        fontWeight: '700',
    },
    requesterDetails: {
        flex: 1,
    },
    requesterName: {
        fontSize: fp(18),
        fontWeight: '700',
    },
    requesterSubtitle: {
        fontSize: fp(14),
        marginTop: hp(4),
    },
    pageSheetTitle: {
        fontSize: fp(24),
        fontWeight: '700',
        marginBottom: hp(12),
    },
    pageSheetDescription: {
        fontSize: fp(15),
        lineHeight: hp(22),
        marginBottom: hp(20),
    },
    pageSheetDivider: {
        height: 1,
        marginVertical: hp(16),
    },
    pageSheetMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(16),
        marginBottom: hp(24),
    },
    pageSheetMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(6),
    },
    pageSheetMetaText: {
        fontSize: fp(15),
    },
    pageSheetDifficultyBadge: {
        paddingHorizontal: wp(12),
        paddingVertical: hp(5),
        borderRadius: wp(8),
    },
    pageSheetDifficultyText: {
        fontSize: fp(13),
        fontWeight: '600',
    },
    pageSheetSectionTitle: {
        fontSize: fp(18),
        fontWeight: '700',
        marginBottom: hp(12),
        marginTop: hp(8),
    },
    pageSheetIngredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(10),
    },
    pageSheetIngredientBullet: {
        width: wp(7),
        height: wp(7),
        borderRadius: wp(4),
        marginRight: wp(12),
    },
    pageSheetIngredientText: {
        fontSize: fp(15),
        flex: 1,
    },
    pageSheetInstructionsText: {
        fontSize: fp(15),
        lineHeight: hp(24),
        marginBottom: hp(20),
    },
    pageSheetToolsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(10),
        marginBottom: hp(20),
    },
    pageSheetToolBadge: {
        paddingHorizontal: wp(14),
        paddingVertical: hp(8),
        borderRadius: wp(10),
    },
    pageSheetToolText: {
        fontSize: fp(14),
        fontWeight: '500',
    },
    pageSheetActionButtons: {
        flexDirection: 'row',
        gap: wp(12),
        padding: wp(20),
        paddingTop: hp(12),
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
    },

    // PageSheet Dish Image
    pageSheetDishImage: {
        width: '100%',
        height: hp(220),
        borderRadius: wp(16),
        marginBottom: hp(20),
    },
    pageSheetImagePlaceholder: {
        width: '100%',
        height: hp(180),
        borderRadius: wp(16),
        marginBottom: hp(20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageSheetImagePlaceholderText: {
        fontSize: fp(14),
        marginTop: hp(8),
    },

    // Write Review Modal - Scroll Content
    writeReviewScrollContent: {
        padding: wp(20),
        paddingBottom: hp(10),
        flexGrow: 1,
    },

    // Expandable Dish Preview (in Write Review Modal)
    expandableDishPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(14),
        borderRadius: wp(12),
        marginBottom: hp(12),
        gap: wp(10),
    },
    expandableDishTitle: {
        flex: 1,
        fontSize: fp(15),
        fontWeight: '600',
    },

    // Expanded Post Details
    expandedPostDetails: {
        borderRadius: wp(12),
        padding: wp(14),
        marginBottom: hp(16),
        marginTop: hp(-4),
    },
    expandedPostImage: {
        width: '100%',
        height: hp(160),
        borderRadius: wp(10),
        marginBottom: hp(12),
    },
    expandedImagePlaceholder: {
        width: '100%',
        height: hp(120),
        borderRadius: wp(10),
        marginBottom: hp(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    expandedPostDescription: {
        fontSize: fp(13),
        lineHeight: hp(20),
        marginBottom: hp(12),
    },
    expandedContextBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: wp(8),
        padding: wp(10),
        borderRadius: wp(8),
        marginBottom: hp(12),
    },
    expandedContextText: {
        flex: 1,
        fontSize: fp(12),
        lineHeight: hp(18),
        fontStyle: 'italic',
    },
    expandedMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(12),
    },
    expandedMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(4),
    },
    expandedMetaText: {
        fontSize: fp(12),
    },
    expandedDifficultyBadge: {
        paddingHorizontal: wp(8),
        paddingVertical: hp(3),
        borderRadius: wp(6),
    },
    expandedDifficultyText: {
        fontSize: fp(11),
        fontWeight: '600',
    },
});