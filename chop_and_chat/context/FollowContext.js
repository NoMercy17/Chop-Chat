import React, { createContext, useContext, useState, useCallback } from 'react';

const FollowContext = createContext();

export const useFollow = () => {
    const context = useContext(FollowContext);
    if (!context) {
        throw new Error('useFollow must be used within a FollowProvider');
    }
    return context;
};

export const FollowProvider = ({ children }) => {
    // Current user's following count - starts at 0
    const [myFollowingCount, setMyFollowingCount] = useState(0);
    
    // Track who we're following (by userId)
    const [followedUsers, setFollowedUsers] = useState(new Set());

    // Follow a user
    const followUser = useCallback((userId) => {
        setFollowedUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(userId);
            return newSet;
        });
        setMyFollowingCount(prev => prev + 1);
    }, []);

    // Unfollow a user
    const unfollowUser = useCallback((userId) => {
        setFollowedUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
        });
        setMyFollowingCount(prev => Math.max(0, prev - 1));
    }, []);

    // Check if following a user
    const isFollowingUser = useCallback((userId) => {
        return followedUsers.has(userId);
    }, [followedUsers]);

    // Toggle follow status
    const toggleFollow = useCallback((userId) => {
        if (isFollowingUser(userId)) {
            unfollowUser(userId);
            return false;
        } else {
            followUser(userId);
            return true;
        }
    }, [isFollowingUser, followUser, unfollowUser]);

    const value = {
        myFollowingCount,
        followedUsers,
        followUser,
        unfollowUser,
        isFollowingUser,
        toggleFollow,
    };

    return (
        <FollowContext.Provider value={value}>
            {children}
        </FollowContext.Provider>
    );
};

export default FollowContext;
