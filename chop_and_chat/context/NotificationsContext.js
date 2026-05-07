import React, { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { api } from '../services/api';
import { ChefService } from '../services/ChefService';

const NotificationsContext = createContext();

// Notification Types
export const NOTIFICATION_TYPES = {
  NEW_FOLLOWER: 'new_follower',
  POST_LIKES: 'post_likes',
  CHEF_REVIEW_RECEIVED: 'chef_review_received',
  CHEF_REVIEW_REQUEST: 'chef_review_request', // Claimable - for chefs only
  COMMENT_ON_POST: 'comment_on_post',
};

export function NotificationsProvider({ children }) {
  const { user, token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Derive if current user is chef from AuthContext
  const isChef = user?.isChef || false;

  const formatTime = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now - then) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const refreshNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get('/notifications', token);
      const backendNotifs = (data.notifications || []).map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        subtitle: n.subtitle,
        data: n.data,
        unread: !n.is_read,
        read: n.is_read,
        timestamp: new Date(n.created_at).getTime(),
        time: formatTime(n.created_at),
        claimedBy: n.data?.claimedBy || null,
      }));
      setNotifications(backendNotifs);
    } catch (error) {
      console.error('[NotificationsContext:refreshNotifications] Failed:', error.message);
    }
  }, [token]);

  // Initial load and polling
  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  // Get unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.unread).length;
  }, [notifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!token) return;
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, unread: false, read: true } : n));
      await api.patch(`/notifications/${notificationId}/read`, {}, token);
    } catch (error) {
      console.error(`[NotificationsContext:markAsRead] Failed:`, error.message);
      refreshNotifications();
    }
  }, [token, refreshNotifications]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!token) return;
    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Optionally add DELETE /notifications/:id to backend
    } catch (error) {
      console.error(`[NotificationsContext:deleteNotification] Failed:`, error.message);
    }
  }, [token]);

  // Claim a review request (for chefs)
  const claimReviewRequest = useCallback(async (notificationId, requestId) => {
    if (!token || !isChef) return;
    try {
      // 1. Claim in backend
      await ChefService.claimRequest(requestId, token);
      
      // 2. Mark notification as read and claimed locally
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, unread: false, read: true, claimedBy: user.id } : n)
      );
      
      // 3. Mark read in backend
      await api.patch(`/notifications/${notificationId}/read`, {}, token);
    } catch (error) {
      console.error(`[NotificationsContext:claimReviewRequest] Failed:`, error.message);
      refreshNotifications();
      throw error;
    }
  }, [token, isChef, user?.id, refreshNotifications]);

  // Submit a chef review
  const submitChefReview = useCallback(async (notificationId, requestId, postId, reviewText) => {
    if (!token || !isChef) return;
    try {
      // 1. Post the review to backend
      await ChefService.postReview({
        post_id: postId,
        reaction_text: reviewText,
        request_id: requestId
      }, token);

      // 2. Mark notification as read (if not already)
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // 3. Optional: Mark read in backend if it wasn't
      await api.patch(`/notifications/${notificationId}/read`, {}, token);
    } catch (error) {
      console.error(`[NotificationsContext:submitChefReview] Failed:`, error.message);
      refreshNotifications();
      throw error;
    }
  }, [token, isChef, refreshNotifications]);

  // Cancel a claim (for Chefs who claimed but haven't reviewed yet)
  const cancelReviewClaim = useCallback(async (notificationId) => {
    // For now, this just refreshes notifications to sync with backend
    // A more advanced version would call an unclaim endpoint
    refreshNotifications();
  }, [refreshNotifications]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    currentUser: user,
    markAsRead,
    deleteNotification,
    claimReviewRequest,
    submitChefReview,
    cancelReviewClaim,
    refreshNotifications,
    NOTIFICATION_TYPES,
  }), [
    notifications, 
    unreadCount, 
    user,
    markAsRead, 
    deleteNotification, 
    claimReviewRequest, 
    submitChefReview,
    cancelReviewClaim,
    refreshNotifications
  ]);

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
