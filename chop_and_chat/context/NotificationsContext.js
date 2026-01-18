import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationsContext = createContext();

// Notification Types
export const NOTIFICATION_TYPES = {
  NEW_FOLLOWER: 'new_follower',
  POST_LIKES: 'post_likes',
  CHEF_REVIEW_RECEIVED: 'chef_review_received',
  CHEF_REVIEW_REQUEST: 'chef_review_request', // Claimable - for chefs only
};

// Mock user data - in real app would come from auth context/backend
const MOCK_CURRENT_USER = {
  id: 'user_1',
  username: 'Antonio',
  isChef: true, // Toggle this to test chef functionality
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
    timestamp: Date.now() - 2 * 60 * 1000,
    unread: true,
    read: false,
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
      daysSincePost: 0, // Day 1
    },
    time: '1h ago',
    timestamp: Date.now() - 60 * 60 * 1000,
    unread: true,
    read: false,
  },
  {
    id: 'notif_3',
    type: NOTIFICATION_TYPES.CHEF_REVIEW_RECEIVED,
    title: 'Chef Review Received!',
    subtitle: 'Chef Gordon reviewed your Beef Wellington',
    data: {
      postId: 'post_3',
      postTitle: 'Beef Wellington',
      postImage: null,
      chefId: 'chef_gordon',
      chefName: 'Chef Gordon',
      chefAvatar: 'CG',
      reviewMessage: "Excellent execution on this Beef Wellington! The sear on the beef looks perfect - you've achieved a beautiful golden crust which tells me the pan was properly heated. The mushroom duxelles appears well-cooked and dry, which is crucial to prevent soggy pastry.\n\nA few notes for improvement:\n1. Try to get a more even layer of the duxelles - I can see some thicker patches\n2. The pastry could benefit from a few more minutes in the oven for that deep golden color\n3. Consider adding a thin layer of mustard on the beef before the duxelles for an extra flavor dimension\n\nOverall, this is restaurant-quality work. You should be proud! Keep pushing your skills and don't be afraid to experiment with different mushroom varieties in your duxelles. Well done! ⭐⭐⭐⭐",
      rating: 4,
    },
    time: '3h ago',
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
    unread: true,
    read: false,
  },
  {
    id: 'notif_4',
    type: NOTIFICATION_TYPES.NEW_FOLLOWER,
    title: 'New Follower',
    subtitle: 'Elena started following you',
    data: {
      followerId: 'user_elena',
      followerName: 'Elena',
      followerAvatar: 'E',
    },
    time: '5h ago',
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    unread: false,
    read: true,
  },
  {
    id: 'notif_5',
    type: NOTIFICATION_TYPES.POST_LIKES,
    title: 'People love your recipe!',
    subtitle: 'Your Chicken Tacos reached 20 likes',
    data: {
      postId: 'post_7',
      postTitle: 'Chicken Tacos',
      likesCount: 20,
      daysSincePost: 2, // Day 3+
    },
    time: '1d ago',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    unread: false,
    read: true,
  },
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
      requesterId: 'user_maria',
      requesterName: 'Maria',
      requesterAvatar: 'M',
      postId: 'req_post_1',
      postTitle: 'Homemade Ramen Bowl',
      postDescription: 'Slow-cooked broth, handmade noodles, soft boiled egg and fresh toppings.',
      postImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
      ingredients: [
        '1L chicken bone broth',
        '200g fresh ramen noodles',
        '2 soft-boiled eggs',
        '100g chashu pork',
        'Nori sheets',
        'Green onions',
        'Sesame seeds',
      ],
      instructions: 'Simmer bone broth for 4 hours with ginger and garlic.\n\nSeason with soy sauce, mirin, and sesame oil.\n\nCook noodles according to package, drain.\n\nAssemble bowl: noodles, hot broth, toppings.\n\nAdd soft-boiled egg cut in half.\n\nGarnish with green onions and sesame seeds.',
      utensils: ['pot', 'stove'],
      difficulty: 'Medium',
      cookTime: '4h 30min',
      context: 'I tried making ramen for the first time. Used chicken bones and simmered for 4 hours. Not sure if my broth is rich enough or if my egg timing (6 minutes) is right.',
      targetChefs: 'Following',
    },
    time: '10m ago',
    timestamp: Date.now() - 10 * 60 * 1000,
    unread: true,
    read: false,
    claimedBy: null, // null means available for claiming
  },
  {
    id: 'chef_notif_2',
    type: NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST,
    title: 'Review Request',
    subtitle: 'Diego needs expert advice on their creation',
    data: {
      requestId: 'req_2',
      requesterId: 'user_diego',
      requesterName: 'Diego',
      requesterAvatar: 'D',
      postId: 'req_post_2',
      postTitle: 'Mole Poblano',
      postDescription: 'Traditional Mexican sauce with chocolate and chilies served over chicken.',
      postImage: 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=800',
      ingredients: [
        '4 dried ancho chilies',
        '2 dried pasilla chilies',
        '50g Mexican chocolate',
        '1/4 cup almonds',
        '1/4 cup sesame seeds',
        'Cinnamon stick',
        'Chicken thighs',
      ],
      instructions: 'Toast and rehydrate dried chilies.\n\nBlend chilies with almonds, sesame, spices.\n\nCook sauce for 30 minutes, stirring constantly.\n\nAdd chocolate, stir until melted.\n\nSimmer chicken in sauce until cooked through.\n\nGarnish with sesame seeds.',
      utensils: ['blender', 'pot', 'stove'],
      difficulty: 'Hard',
      cookTime: '2h',
      context: 'This is my grandmother\'s recipe but something is off. The sauce tastes bitter. Did I burn the chilies? Should the chocolate be added earlier?',
      targetChefs: 'All Chefs',
    },
    time: '25m ago',
    timestamp: Date.now() - 25 * 60 * 1000,
    unread: true,
    read: false,
    claimedBy: null,
  },
];

export function NotificationsProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(MOCK_CURRENT_USER);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [chefNotifications, setChefNotifications] = useState(INITIAL_CHEF_NOTIFICATIONS);

  // Get all notifications based on user type
  const getAllNotifications = useCallback(() => {
    if (currentUser.isChef) {
      // Chefs see their own notifications plus claimable review requests
      return [...chefNotifications, ...notifications].sort((a, b) => b.timestamp - a.timestamp);
    }
    return notifications.sort((a, b) => b.timestamp - a.timestamp);
  }, [currentUser.isChef, notifications, chefNotifications]);

  // Get unread count
  const getUnreadCount = useCallback(() => {
    const allNotifs = getAllNotifications();
    return allNotifs.filter(n => n.unread && !n.claimedBy).length;
  }, [getAllNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, unread: false, read: true } : n
      )
    );
    setChefNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, unread: false, read: true } : n
      )
    );
  }, []);

  // Delete notification
  const deleteNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setChefNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Claim a review request (for chefs)
  const claimReviewRequest = useCallback((notificationId, chefId) => {
    setChefNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, claimedBy: chefId } : n
      )
    );
    // In real app, this would also notify other chefs via WebSocket/backend
    // to remove the notification from their list
  }, []);

  // Submit chef review (after claiming)
  const submitChefReview = useCallback((notificationId, reviewMessage) => {
    // Get the notification data before removing it
    const notification = chefNotifications.find(n => n.id === notificationId);
    
    // Remove the claimable notification from this chef's list
    setChefNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // TODO: Backend integration skeleton
    // In real app, this would:
    // 1. POST to /api/reviews/submit with:
    //    - notificationId
    //    - reviewMessage
    //    - chefId (currentUser.id)
    //    - requesterId (notification.data.requesterId)
    //    - postId (notification.data.postId)
    // 
    // 2. Backend should then:
    //    a) Save the review to database
    //    b) Create a new CHEF_REVIEW_RECEIVED notification for the requester
    //    c) Broadcast via WebSocket to ALL CHEFS to remove this notification
    //       (so other chefs no longer see this claimable request)
    //    d) Return success/failure
    //
    // 3. WebSocket listener (to be implemented):
    //    socket.on('review_request_claimed', (data) => {
    //      setChefNotifications(prev => prev.filter(n => n.id !== data.notificationId));
    //    });
    
    console.log('Review submitted:', { 
      notificationId, 
      reviewMessage,
      requesterData: notification?.data 
    });
    
    return true;
  }, [chefNotifications]);

  // Cancel review claim
  const cancelReviewClaim = useCallback((notificationId) => {
    setChefNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, claimedBy: null } : n
      )
    );
  }, []);

  // Add new notification (for testing/mock purposes)
  const addNotification = useCallback((notification) => {
    const newNotif = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: Date.now(),
      unread: true,
      read: false,
    };
    
    if (notification.type === NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST) {
      setChefNotifications(prev => [newNotif, ...prev]);
    } else {
      setNotifications(prev => [newNotif, ...prev]);
    }
  }, []);

  // Toggle user type (for testing)
  const toggleChefMode = useCallback(() => {
    setCurrentUser(prev => ({ ...prev, isChef: !prev.isChef }));
  }, []);

  const value = {
    currentUser,
    notifications: getAllNotifications(),
    unreadCount: getUnreadCount(),
    markAsRead,
    deleteNotification,
    claimReviewRequest,
    submitChefReview,
    cancelReviewClaim,
    addNotification,
    toggleChefMode,
    NOTIFICATION_TYPES,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

export default NotificationsContext;
