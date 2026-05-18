import { Text, View, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications, NOTIFICATION_TYPES } from '../../context/NotificationsContext';
import { useChefFeed } from '../../context/ChefFeedContext';
import ChefReviewModal from '../posts/ChefReviewModal';
import NotificationListModal from './notifications/NotificationListModal';
import NotificationDetailModal from './notifications/NotificationDetailModal';

export default function Header({ navigation }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [chefReviewModalVisible, setChefReviewModalVisible] = useState(false);
    const [claiming, setClaiming] = useState(false);
    
    const { theme } = useTheme();
    const { refreshFeed } = useChefFeed();
    const {
        notifications,
        unreadCount,
        currentUser,
        markAsRead,
        deleteNotification,
        claimReviewRequest,
        submitChefReview,
        cancelReviewClaim,
        bellTrigger,
    } = useNotifications();

    // Open notification panel when toast is tapped
    useEffect(() => {
        if (bellTrigger > 0) setModalVisible(true);
    }, [bellTrigger]);

    const handleNotificationPress = useCallback((notification) => {
        markAsRead(notification.id);
        setSelectedNotification(notification);

        if (notification.type === NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST) {
            setModalVisible(false);
            requestAnimationFrame(() => {
                // Already claimed by this chef — skip the info/claim screen and go straight
                // to the review editor. The detail modal is only for unclaimed requests.
                if (notification.data?.claimedBy && notification.data.claimedBy === currentUser?.id) {
                    setChefReviewModalVisible(true);
                } else {
                    setDetailModalVisible(true);
                }
            });
        } else if (notification.type === NOTIFICATION_TYPES.CHEF_REVIEW_RECEIVED) {
            setDetailModalVisible(true);
        }
    }, [markAsRead, currentUser]);

    const handleDeleteNotification = useCallback((notificationId) => {
        deleteNotification(notificationId);
    }, [deleteNotification]);

    const handleClaimReview = useCallback(async () => {
        if (!selectedNotification || !currentUser) return;

        const requestId = selectedNotification.data?.requestId;
        if (!requestId) {
            // Stale notification with no requestId — auto-dismiss it so it doesn't reappear
            deleteNotification(selectedNotification.id);
            setDetailModalVisible(false);
            setSelectedNotification(null);
            Alert.alert('Not Available', 'This request is no longer available.');
            return;
        }

        setClaiming(true);
        try {
            if (selectedNotification.data?.claimedBy !== currentUser.id) {
                await claimReviewRequest(selectedNotification.id, requestId);
            }
            setDetailModalVisible(false);
            setChefReviewModalVisible(true);
        } catch (error) {
            console.error('[Header:handleClaimReview] Failed to claim:', error.message);
            // Another chef claimed it first — remove from this chef's list and explain why
            deleteNotification(selectedNotification.id);
            setDetailModalVisible(false);
            setSelectedNotification(null);
            Alert.alert(
                'Already Claimed',
                'Another chef has already claimed this review request. It has been removed from your notifications.'
            );
        } finally {
            setClaiming(false);
        }
    }, [selectedNotification, currentUser, claimReviewRequest]);

    const handleCloseDetail = useCallback(() => {
        setDetailModalVisible(false);
        setSelectedNotification(null);
    }, []);

    const handleReviewSubmit = useCallback(async ({ reaction_text }) => {
        if (!selectedNotification) return;
        
        const requestId = selectedNotification.data?.requestId;
        const postId = selectedNotification.data?.postId;
        
        await submitChefReview(selectedNotification.id, requestId, postId, reaction_text);
        setChefReviewModalVisible(false);
        setSelectedNotification(null);
        refreshFeed();
    }, [selectedNotification, submitChefReview, refreshFeed]);

    const handleCancelReview = useCallback(() => {
        cancelReviewClaim(selectedNotification?.id);
        setChefReviewModalVisible(false);
        setSelectedNotification(null);
    }, [selectedNotification, cancelReviewClaim]);

    // Filter out claimed notifications (unless claimed by current user)
    // Also filter out requests that the current user has already completed
    const visibleNotifications = notifications.filter(n => {
        if (n.type === NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST) {
            if (n.data?.requestStatus === 'completed') return false;
            if (n.claimedBy) return n.claimedBy === currentUser?.id;
        }
        return true;
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.primary }]}>
            <Text style={[styles.appName, { color: theme.textInverse }]}>Chop & Chat</Text>

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
                        <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                            <Text style={[styles.badgeText, { color: theme.textInverse }]}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
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
            <NotificationListModal 
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                notifications={visibleNotifications}
                theme={theme}
                onNotificationPress={handleNotificationPress}
                onDeleteNotification={handleDeleteNotification}
                currentUser={currentUser}
            />

            {/* Detail Modal (Review Received or Review Request Detail) */}
            <NotificationDetailModal 
                visible={detailModalVisible}
                onClose={handleCloseDetail}
                notification={selectedNotification}
                theme={theme}
                currentUser={currentUser}
                onClaim={handleClaimReview}
                claiming={claiming}
            />

            {/* Specialized Chef Review Modal */}
            <ChefReviewModal 
                visible={chefReviewModalVisible}
                onClose={handleCancelReview}
                request={selectedNotification}
                onSubmit={handleReviewSubmit}
            />
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
        letterSpacing: -0.5,
    },
    rightButtons: {
        flexDirection: 'row',
        gap: wp(4),
    },
    button: {
        width: wp(44),
        height: wp(44),
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
        borderRadius: wp(10),
        minWidth: wp(18),
        height: wp(18),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(4),
    },
    badgeText: {
        fontSize: fp(10),
        fontWeight: '700',
    },
});
