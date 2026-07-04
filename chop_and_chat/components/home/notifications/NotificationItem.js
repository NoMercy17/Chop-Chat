import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../../utils/responsive';
import { NOTIFICATION_TYPES } from '../../../context/NotificationsContext';

export default function NotificationItem({ 
    notification, 
    theme, 
    onPress, 
    onDelete, 
    currentUser 
}) {
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
            case NOTIFICATION_TYPES.COMMENT_ON_POST:
                return 'chatbubble';
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
            case NOTIFICATION_TYPES.COMMENT_ON_POST:
                return '#8B5CF6';
            default:
                return theme.primary;
        }
    };

    const iconColor = getNotificationIconColor(notification.type);

    return (
        <Pressable
            style={({ pressed }) => [
                styles.notificationItem,
                { backgroundColor: theme.cardBackgroundAlt, borderColor: theme.borderLight },
                notification.unread && [styles.notificationUnread, { backgroundColor: theme.primaryLightest, borderColor: theme.primaryLighter }],
                notification.type === NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST && styles.claimableNotification,
                pressed && styles.notificationPressed
            ]}
            onPress={() => onPress(notification)}
        >
            <View style={[styles.notificationIcon, { backgroundColor: iconColor + '20' }]}>
                <Ionicons 
                    name={getNotificationIcon(notification.type)} 
                    size={fp(18)} 
                    color={iconColor} 
                />
            </View>

            <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                    <Text style={[styles.notificationTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                        {notification.title}
                    </Text>
                    <Text style={[styles.notificationTime, { color: theme.textTertiary }]}>{notification.time}</Text>
                </View>
                <Text style={[styles.notificationSubtitle, { color: theme.textSecondary }]} numberOfLines={2}>
                    {notification.subtitle}
                </Text>
                {notification.type === NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST && (
                    <View style={styles.tapToReviewHint}>
                        <Ionicons name="hand-left" size={fp(12)} color={theme.primary} />
                        <Text style={[styles.tapToReviewText, { color: theme.primary }]}>
                            {notification.claimedBy === currentUser?.id ? 'Continue Review' : 'Tap to claim & review'}
                        </Text>
                    </View>
                )}
            </View>

            <Pressable 
                style={styles.deleteButton}
                onPress={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="close" size={fp(18)} color={theme.textTertiary} />
            </Pressable>
        </Pressable>
    );
}

const styles = StyleSheet.create({
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
});
