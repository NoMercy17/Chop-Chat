import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { api } from '../services/api';
import { AuthContext } from './AuthContext';
import { mockCommunityPosts } from '../data/mockData';

const PostsContext = createContext();

export function PostsProvider({ children }) {
    const { token } = useContext(AuthContext);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = useCallback(async () => {
        if (!token) {
            setPosts(mockCommunityPosts);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await api.get('/posts', token);
            // Fall back to mock data when the API returns nothing yet (demo mode)
            const source = data && data.length ? data : mockCommunityPosts;
            setPosts(source);
        } catch (error) {
            console.error('[PostsContext:fetchPosts] Failed to fetch posts:', error.message);
            setPosts(mockCommunityPosts);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleLike = useCallback(async (postId) => {
        // Optimistic update
        setPosts(currentPosts => 
            currentPosts.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        likes: post.liked ? post.likes - 1 : post.likes + 1,
                        liked: !post.liked
                    };
                }
                return post;
            })
        );

        try {
            const result = await api.post('/posts/like', { post_id: postId }, token);
            if (result && typeof result.liked === 'boolean') {
                setPosts(currentPosts =>
                    currentPosts.map(post => {
                        if (post.id !== postId || post.liked === result.liked) return post;
                        return { ...post, liked: result.liked, likes: post.likes + (result.liked ? 1 : -1) };
                    })
                );
            }
        } catch (error) {
            console.error(`[PostsContext:handleLike] Failed to like post ${postId}:`, error.message);
            Alert.alert('Could not like post', 'Please try again.');
            fetchPosts();
        }
    }, [token, fetchPosts]);

    const updateCommentCount = useCallback((postId) => {
        setPosts(currentPosts =>
            currentPosts.map(post => {
                if (post.id === postId) {
                    return { ...post, comments: post.comments + 1 };
                }
                return post;
            })
        );
    }, []);

    const handleSave = useCallback(async (postId) => {
        setPosts(currentPosts => 
            currentPosts.map(post => {
                if (post.id === postId) {
                    return { ...post, saved: !post.saved };
                }
                return post;
            })
        );

        try {
            await api.post('/posts/save', { post_id: postId }, token);
        } catch (error) {
            console.error(`[PostsContext:handleSave] Failed to save post ${postId}:`, error.message);
            Alert.alert('Could not save post', 'Please try again.');
            fetchPosts();
        }
    }, [token, fetchPosts]);

    const addComment = useCallback(async (postId, text) => {
        if (!token || !text?.trim()) return null;
        try {
            const result = await api.post(`/posts/${postId}/comments`, { text }, token);
            if (result?.comment) updateCommentCount(postId);
            return result?.comment ?? null;
        } catch (error) {
            console.error(`[PostsContext:addComment] ${postId}:`, error.message);
            Alert.alert('Could not post comment', 'Please try again.');
            return null;
        }
    }, [token, updateCommentCount]);

    const value = useMemo(() => ({
        posts,
        loading,
        handleLike,
        handleSave,
        updateCommentCount,
        addComment,
        refreshPosts: fetchPosts
    }), [posts, loading, handleLike, handleSave, updateCommentCount, addComment, fetchPosts]);

    return (
        <PostsContext.Provider value={value}>
            {children}
        </PostsContext.Provider>
    );
}

export function usePosts() {
    const context = useContext(PostsContext);
    if (!context) {
        throw new Error('[PostsContext] usePosts must be used within a PostsProvider');
    }
    return context;
}
