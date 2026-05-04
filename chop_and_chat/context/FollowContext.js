import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { AuthContext } from './AuthContext';
import { api } from '../services/api';

const FollowContext = createContext();

export const useFollow = () => {
    const context = useContext(FollowContext);
    if (!context) {
        throw new Error('[FollowContext] useFollow must be used within a FollowProvider');
    }
    return context;
};

// Wraps the backend follow endpoints with an optimistic local cache so callers
// (OtherUserProfileScreen.toggleFollow) can stay synchronous. The backend is
// the source of truth — local state is reconciled on mount and on auth change,
// and failed mutations revert.
export const FollowProvider = ({ children }) => {
    const { user, token } = useContext(AuthContext);

    const [followedUsers, setFollowedUsers] = useState(new Set());
    const [myFollowingCount, setMyFollowingCount] = useState(0);

    const refreshMyFollows = useCallback(async () => {
        if (!user?.id || !token) {
            setFollowedUsers(new Set());
            setMyFollowingCount(0);
            return;
        }
        try {
            const data = await api.get(`/users/${user.id}/following`, token);
            const ids = new Set((data.following || []).map(u => u.id));
            setFollowedUsers(ids);
            setMyFollowingCount(typeof data.count === 'number' ? data.count : ids.size);
        } catch (error) {
            console.error('[FollowContext:refreshMyFollows] Failed:', error.message);
        }
    }, [user?.id, token]);

    useEffect(() => { refreshMyFollows(); }, [refreshMyFollows]);

    const isFollowingUser = useCallback((userId) => followedUsers.has(userId), [followedUsers]);

    // Optimistic follow: update local state immediately, sync to backend, revert on error.
    const followUser = useCallback((userId) => {
        if (!token || followedUsers.has(userId)) return;
        setFollowedUsers(prev => {
            const next = new Set(prev);
            next.add(userId);
            return next;
        });
        setMyFollowingCount(prev => prev + 1);

        api.post(`/users/${userId}/follow`, {}, token).catch(error => {
            // 409 means we were already following on the server — keep local state.
            if (error.status === 409) return;
            console.error(`[FollowContext:followUser] ${userId}:`, error.message);
            setFollowedUsers(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
            setMyFollowingCount(prev => Math.max(0, prev - 1));
        });
    }, [token, followedUsers]);

    const unfollowUser = useCallback((userId) => {
        if (!token || !followedUsers.has(userId)) return;
        setFollowedUsers(prev => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
        });
        setMyFollowingCount(prev => Math.max(0, prev - 1));

        api.delete(`/users/${userId}/follow`, token).catch(error => {
            // 404 means the relationship was already gone server-side.
            if (error.status === 404) return;
            console.error(`[FollowContext:unfollowUser] ${userId}:`, error.message);
            setFollowedUsers(prev => {
                const next = new Set(prev);
                next.add(userId);
                return next;
            });
            setMyFollowingCount(prev => prev + 1);
        });
    }, [token, followedUsers]);

    // Returns the new follow state synchronously so callers can update derived counts
    // without awaiting the backend round-trip.
    const toggleFollow = useCallback((userId) => {
        if (followedUsers.has(userId)) {
            unfollowUser(userId);
            return false;
        }
        followUser(userId);
        return true;
    }, [followedUsers, followUser, unfollowUser]);

    const getFollowersCount = useCallback(async (userId) => {
        if (!token) return 0;
        try {
            const data = await api.get(`/users/${userId}/followers`, token);
            return data.count ?? 0;
        } catch (error) {
            console.error(`[FollowContext:getFollowersCount] ${userId}:`, error.message);
            return 0;
        }
    }, [token]);

    const getFollowingCount = useCallback(async (userId) => {
        if (!token) return 0;
        try {
            const data = await api.get(`/users/${userId}/following`, token);
            return data.count ?? 0;
        } catch (error) {
            console.error(`[FollowContext:getFollowingCount] ${userId}:`, error.message);
            return 0;
        }
    }, [token]);

    const value = useMemo(() => ({
        myFollowingCount,
        followedUsers,
        followUser,
        unfollowUser,
        isFollowingUser,
        toggleFollow,
        refreshMyFollows,
        getFollowersCount,
        getFollowingCount,
    }), [
        myFollowingCount,
        followedUsers,
        followUser,
        unfollowUser,
        isFollowingUser,
        toggleFollow,
        refreshMyFollows,
        getFollowersCount,
        getFollowingCount,
    ]);

    return (
        <FollowContext.Provider value={value}>
            {children}
        </FollowContext.Provider>
    );
};

export default FollowContext;
