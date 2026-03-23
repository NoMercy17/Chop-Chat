import React, { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react';
import { AuthContext } from './AuthContext';

const NotificationsContext = createContext();

// Notification Types
export const NOTIFICATION_TYPES = {
  NEW_FOLLOWER: 'new_follower',
  POST_LIKES: 'post_likes',
  CHEF_REVIEW_RECEIVED: 'chef_review_received',
  CHEF_REVIEW_REQUEST: 'chef_review_request', // Claimable - for chefs only
};

// Sample notifications data
const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_1',
    type: NOTIFICATION_TYPES.NEW_FOLLOWER,
    title: 'New Follower',
    subtitle: 'Chef Maria started following you',
    data: {
      followerId: 'chef_maria',
      followerName: 'Chef Maria',
      followerAvatar: 'CM',
    },
    time: '2m ago',
    unread: true,
    read: false,
    timestamp: Date.now() - 2 * 60 * 1000,
  },
  {
    id: 'notif_2',
    type: NOTIFICATION_TYPES.POST_LIKES,
    title: 'Your post is getting attention!',
    subtitle: 'Your Pasta Carbonara reached 10 likes',
    data: {
      postId: 'post_1',
      postTitle: 'Pasta Carbonara',
      likesCount: 10,
    },
    time: '1h ago',
    unread: true,
    read: false,
    timestamp: Date.now() - 60 * 60 * 1000,
  }
];

// Sample claimable review requests (for chefs only)
const INITIAL_CHEF_NOTIFICATIONS = [
  {
    id: 'chef_notif_1',
    type: NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST,
    title: 'Review Request',
    subtitle: 'Maria wants your feedback on their dish',
    data: {
      requestId: 'req_1',
      requesterName: 'Maria',
      postTitle: 'Homemade Ramen Bowl',
    },
    time: '10m ago',
    unread: true,
    read: false,
    timestamp: Date.now() - 10 * 60 * 1000,
    claimedBy: null,
  }
];

export function NotificationsProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [chefNotifications, setChefNotifications] = useState(INITIAL_CHEF_NOTIFICATIONS);

  // Derive if current user is chef from AuthContext
  const isChef = user?.isChef || false;

  // Get all notifications based on user type
  const allNotifications = useMemo(() => {
    let combined = [...notifications];
    if (isChef) {
      combined = [...combined, ...chefNotifications];
    }
    return combined.sort((a, b) => b.timestamp - a.timestamp);
  }, [isChef, notifications, chefNotifications]);

  // Get unread count
  const unreadCount = useMemo(() => {
    return allNotifications.filter(n => n.unread && !n.claimedBy).length;
  }, [allNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    try {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, unread: false, read: true } : n));
      setChefNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, unread: false, read: true } : n));
    } catch (error) {
      console.error(`[NotificationsContext:markAsRead] Failed to mark read:`, error.message);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback((notificationId) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setChefNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error(`[NotificationsContext:deleteNotification] Failed to delete:`, error.message);
    }
  }, []);

  // Claim a review request (for chefs)
  const claimReviewRequest = useCallback((notificationId, chefId) => {
    try {
      setChefNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, claimedBy: chefId } : n)
      );
    } catch (error) {
      console.error(`[NotificationsContext:claimReviewRequest] Failed to claim:`, error.message);
    }
  }, []);

  const value = useMemo(() => ({
    notifications: allNotifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    claimReviewRequest,
    NOTIFICATION_TYPES,
  }), [allNotifications, unreadCount, markAsRead, deleteNotification, claimReviewRequest]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('[NotificationsContext] useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

export default NotificationsContext;
