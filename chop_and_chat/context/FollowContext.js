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
    const [pendingUsers, setPendingUsers] = useState(new Set());

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
    const isFollowPending = useCallback((userId) => pendingUsers.has(userId), [pendingUsers]);

    const followUser = useCallback((userId) => {
        if (!token || followedUsers.has(userId) || pendingUsers.has(userId)) return;
        setPendingUsers(prev => { const n = new Set(prev); n.add(userId); return n; });
        setFollowedUsers(prev => { const n = new Set(prev); n.add(userId); return n; });
        setMyFollowingCount(prev => prev + 1);

        api.post(`/users/${userId}/follow`, {}, token)
            .then(() => refreshMyFollows())
            .catch(error => {
                if (error.status === 409) { refreshMyFollows(); return; }
                console.error(`[FollowContext:followUser] ${userId}:`, error.message);
                setFollowedUsers(prev => { const n = new Set(prev); n.delete(userId); return n; });
                setMyFollowingCount(prev => Math.max(0, prev - 1));
            })
            .finally(() => setPendingUsers(prev => { const n = new Set(prev); n.delete(userId); return n; }));
    }, [token, followedUsers, pendingUsers, refreshMyFollows]);

    const unfollowUser = useCallback((userId) => {
        if (!token || !followedUsers.has(userId) || pendingUsers.has(userId)) return;
        setPendingUsers(prev => { const n = new Set(prev); n.add(userId); return n; });
        setFollowedUsers(prev => { const n = new Set(prev); n.delete(userId); return n; });
        setMyFollowingCount(prev => Math.max(0, prev - 1));

        api.delete(`/users/${userId}/follow`, token)
            .then(() => refreshMyFollows())
            .catch(error => {
                if (error.status === 404) { refreshMyFollows(); return; }
                console.error(`[FollowContext:unfollowUser] ${userId}:`, error.message);
                setFollowedUsers(prev => { const n = new Set(prev); n.add(userId); return n; });
                setMyFollowingCount(prev => prev + 1);
            })
            .finally(() => setPendingUsers(prev => { const n = new Set(prev); n.delete(userId); return n; }));
    }, [token, followedUsers, pendingUsers, refreshMyFollows]);

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
        isFollowPending,
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
        isFollowPending,
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
