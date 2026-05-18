import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { AuthContext } from './AuthContext';
import { ChefService } from '../services/ChefService';
import { api } from '../services/api';
import { mockChefFeedItems } from '../data/mockData';

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

    // Always reflects the latest feedItems without creating a stale closure in handleSave
    const feedItemsRef = useRef(feedItems);
    useEffect(() => { feedItemsRef.current = feedItems; }, [feedItems]);

    const refreshFeed = useCallback(async () => {
        if (!token) {
            if (mountedRef.current) setFeedItems(mockChefFeedItems);
            return;
        }
        setLoading(true);
        try {
            const items = await ChefService.getChefFeed(token);
            // Fall back to mock data when the API returns nothing yet (demo mode)
            const source = items && items.length ? items : mockChefFeedItems;
            if (mountedRef.current) setFeedItems(source);
        } catch (error) {
            console.error('[ChefFeedContext:refreshFeed] Error:', error.message);
            Alert.alert('Feed unavailable', 'Could not load chef feed. Please try again.');
            if (mountedRef.current) setFeedItems(mockChefFeedItems);
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

        // Like/save hit the posts router, not chef — bypassing ChefService is intentional here
        try {
            const result = await api.post('/posts/like', { chef_reaction_id: feedItemId }, token);
            if (result && typeof result.liked === 'boolean') {
                if (mountedRef.current) setFeedItems(curr => curr.map(item => {
                    if (item.id !== feedItemId || item.liked === result.liked) return item;
                    return { ...item, liked: result.liked, likes: item.likes + (result.liked ? 1 : -1) };
                }));
            }
        } catch (error) {
            console.error(`[ChefFeedContext:handleLike] Error liking item ${feedItemId}:`, error.message);
            Alert.alert('Could not like post', 'Please try again.');
            if (mountedRef.current) setFeedItems(curr => toggleLike(curr, feedItemId));
        }
    }, [token]);

    const handleSave = useCallback(async (feedItemId) => {
        setFeedItems(curr => toggleSave(curr, feedItemId));
        if (!token) return;

        const item = feedItemsRef.current.find(i => i.id === feedItemId);
        const targetPostId = item?.reaction?.targetPostId;
        if (!targetPostId) return;

        try {
            await api.post('/posts/save', { post_id: targetPostId }, token);
        } catch (error) {
            console.error(`[ChefFeedContext:handleSave] Error saving item ${feedItemId}:`, error.message);
            Alert.alert('Could not save post', 'Please try again.');
            if (mountedRef.current) setFeedItems(curr => toggleSave(curr, feedItemId));
        }
    }, [token]);

    const unsaveByPostId = useCallback((postId) => {
        setFeedItems(curr => curr.map(item =>
            item.reaction?.targetPostId === postId ? { ...item, saved: false } : item
        ));
    }, []);

    const updateCommentCount = useCallback((feedItemId) => {
        setFeedItems(curr => incrementComments(curr, feedItemId));
    }, []);

    const addComment = useCallback(async (reactionId, text) => {
        if (!token || !text?.trim()) return null;
        try {
            const result = await api.post(`/chef/${reactionId}/comments`, { text }, token);
            if (result?.comment) updateCommentCount(reactionId);
            return result?.comment ?? null;
        } catch (error) {
            console.error(`[ChefFeedContext:addComment] ${reactionId}:`, error.message);
            if (error.data?.error === 'comment_rejected') {
                return { blocked: true, message: error.message };
            }
            if (error.status === 429) {
                return { blocked: true, message: 'You\'re posting too fast. Please wait a moment.' };
            }
            if (error.status === 404) {
                return { blocked: true, message: 'This review no longer exists.' };
            }
            Alert.alert('Could not post comment', error.message || 'Please try again.');
            return null;
        }
    }, [token, updateCommentCount]);

    const updateChefPhoto = useCallback((userId, newPhotoUrl) => {
        setFeedItems(curr => curr.map(item =>
            item.chef?.id === userId
                ? { ...item, chef: { ...item.chef, photo: newPhotoUrl } }
                : item
        ));
    }, []);

    const value = useMemo(() => ({
        feedItems,
        loading,
        refreshFeed,
        handleLike,
        handleSave,
        unsaveByPostId,
        updateCommentCount,
        addComment,
        updateChefPhoto,
    }), [feedItems, loading, refreshFeed, handleLike, handleSave, unsaveByPostId, updateCommentCount, addComment, updateChefPhoto]);

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
