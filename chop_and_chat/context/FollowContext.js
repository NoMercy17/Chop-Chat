import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const FollowContext = createContext();

export const useFollow = () => {
    const context = useContext(FollowContext);
    if (!context) {
        throw new Error('[FollowContext] useFollow must be used within a FollowProvider');
    }
    return context;
};

export const FollowProvider = ({ children }) => {
    // Current user's total following count
    const [myFollowingCount, setMyFollowingCount] = useState(0);
    
    // Track who we're following (by userId) for UI states
    const [followedUsers, setFollowedUsers] = useState(new Set());

    // Follow a user
    const followUser = useCallback((userId) => {
        try {
            setFollowedUsers(prev => {
                const newSet = new Set(prev);
                newSet.add(userId);
                return newSet;
            });
            setMyFollowingCount(prev => prev + 1);
        } catch (error) {
            console.error(`[FollowContext:followUser] Failed to follow user ${userId}:`, error.message);
        }
    }, []);

    // Unfollow a user
    const unfollowUser = useCallback((userId) => {
        try {
            setFollowedUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
            setMyFollowingCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error(`[FollowContext:unfollowUser] Failed to unfollow user ${userId}:`, error.message);
        }
    }, []);

    // Check if following a user
    const isFollowingUser = useCallback((userId) => {
        return followedUsers.has(userId);
    }, [followedUsers]);

    // Toggle follow status
    const toggleFollow = useCallback((userId) => {
        try {
            if (isFollowingUser(userId)) {
                unfollowUser(userId);
                return false;
            } else {
                followUser(userId);
                return true;
            }
        } catch (error) {
            console.error(`[FollowContext:toggleFollow] Error toggling follow for ${userId}:`, error.message);
            return false;
        }
    }, [isFollowingUser, followUser, unfollowUser]);

    const value = useMemo(() => ({
        myFollowingCount,
        followedUsers,
        followUser,
        unfollowUser,
        isFollowingUser,
        toggleFollow,
        setMyFollowingCount, // Allow manual sync from backend if needed
    }), [myFollowingCount, followedUsers, followUser, unfollowUser, isFollowingUser, toggleFollow]);

    return (
        <FollowContext.Provider value={value}>
            {children}
        </FollowContext.Provider>
    );
};

export default FollowContext;
