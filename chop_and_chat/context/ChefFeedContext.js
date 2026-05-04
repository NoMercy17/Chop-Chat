import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { ChefService } from '../services/ChefService';
import { api } from '../services/api';

const ChefFeedContext = createContext();

const toggleLike = (items, id) => items.map(item => (
    item.id === id
        ? { ...item, likes: item.liked ? item.likes - 1 : item.likes + 1, liked: !item.liked }
        : item
));

const toggleSave = (items, id) => items.map(item => (
    item.id === id ? { ...item, saved: !item.saved } : item
));

const incrementComments = (items, id) => items.map(item => (
    item.id === id ? { ...item, comments: item.comments + 1 } : item
));

export function ChefFeedProvider({ children }) {
    const { token } = useContext(AuthContext);
    const [feedItems, setFeedItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const refreshFeed = useCallback(async () => {
        if (!token) {
            if (mountedRef.current) setFeedItems([]);
            return;
        }
        setLoading(true);
        try {
            const items = await ChefService.getChefFeed(token);
            // Hardcode random likes for demo purposes if they are 0
            const enhancedItems = (items || []).map((item, index) => ({
                ...item,
                likes: item.likes > 0 ? item.likes : (300 + index * 27),
                comments: item.comments > 0 ? item.comments : (index % 2 !== 0 ? 1 : 0)
            }));
            if (mountedRef.current) setFeedItems(enhancedItems);
        } catch (error) {
            console.error('[ChefFeedContext:refreshFeed] Error:', error.message);
            if (mountedRef.current) setFeedItems([]);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        refreshFeed();
    }, [refreshFeed]);

    const handleLike = useCallback(async (feedItemId) => {
        setFeedItems(curr => toggleLike(curr, feedItemId));
        if (!token) return;

        try {
            await api.post('/posts/like', { chef_reaction_id: feedItemId }, token);
        } catch (error) {
            console.error(`[ChefFeedContext:handleLike] Error liking item ${feedItemId}:`, error.message);
            // Revert by re-applying the same toggle
            if (mountedRef.current) setFeedItems(curr => toggleLike(curr, feedItemId));
        }
    }, [token]);

    const handleSave = useCallback(async (feedItemId) => {
        setFeedItems(curr => toggleSave(curr, feedItemId));
        if (!token) return;

        const item = feedItems.find(i => i.id === feedItemId);
        const targetPostId = item?.reaction?.targetPostId;
        if (!targetPostId) return;

        try {
            await api.post('/posts/save', { post_id: targetPostId }, token);
        } catch (error) {
            console.error(`[ChefFeedContext:handleSave] Error saving item ${feedItemId}:`, error.message);
            if (mountedRef.current) setFeedItems(curr => toggleSave(curr, feedItemId));
        }
    }, [token, feedItems]);

    const updateCommentCount = useCallback((feedItemId) => {
        setFeedItems(curr => incrementComments(curr, feedItemId));
    }, []);

    const value = useMemo(() => ({
        feedItems,
        loading,
        refreshFeed,
        handleLike,
        handleSave,
        updateCommentCount,
    }), [feedItems, loading, refreshFeed, handleLike, handleSave, updateCommentCount]);

    return (
        <ChefFeedContext.Provider value={value}>
            {children}
        </ChefFeedContext.Provider>
    );
}

export function useChefFeed() {
    const context = useContext(ChefFeedContext);
    if (!context) {
        throw new Error('[ChefFeedContext] useChefFeed must be used within a ChefFeedProvider');
    }
    return context;
}
