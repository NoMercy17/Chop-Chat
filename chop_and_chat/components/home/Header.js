import { Text, View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications, NOTIFICATION_TYPES } from '../../context/NotificationsContext';
import ChefReviewModal from '../posts/ChefReviewModal';
import NotificationListModal from './notifications/NotificationListModal';
import NotificationDetailModal from './notifications/NotificationDetailModal';

export default function Header({ navigation }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [chefReviewModalVisible, setChefReviewModalVisible] = useState(false);
    const [claiming, setClaiming] = useState(false);
    
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
            setModalVisible(false);
            requestAnimationFrame(() => {
                setDetailModalVisible(true);
            });
        } else if (notification.type === NOTIFICATION_TYPES.CHEF_REVIEW_RECEIVED) {
            setDetailModalVisible(true);
        }
    }, [markAsRead]);

    const handleDeleteNotification = useCallback((notificationId) => {
        deleteNotification(notificationId);
    }, [deleteNotification]);

    const handleClaimReview = useCallback(async () => {
        if (!selectedNotification || !currentUser) return;
        
        setClaiming(true);
        try {
            const requestId = selectedNotification.data?.requestId;
            if (selectedNotification.data?.claimedBy !== currentUser.id) {
                await claimReviewRequest(selectedNotification.id, requestId);
            }
            
            setDetailModalVisible(false);
            setChefReviewModalVisible(true);
        } catch (error) {
            console.error('[Header:handleClaimReview] Failed to claim:', error.message);
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
    }, [selectedNotification, submitChefReview]);

    const handleCancelReview = useCallback(() => {
        cancelReviewClaim(selectedNotification?.id);
        setChefReviewModalVisible(false);
        setSelectedNotification(null);
    }, [selectedNotification, cancelReviewClaim]);

    // Filter out claimed notifications (unless claimed by current user)
    const visibleNotifications = notifications.filter(n => {
        if (n.type === NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST && n.claimedBy) {
            return n.claimedBy === currentUser?.id;
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
});
