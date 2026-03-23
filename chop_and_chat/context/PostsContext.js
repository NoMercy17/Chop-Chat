import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { allPosts as initialAllPosts } from '../data/postsData';
import { api } from '../services/api';
import { AuthContext } from './AuthContext';

const PostsContext = createContext();

export function PostsProvider({ children }) {
    const { token } = useContext(AuthContext);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            // In the future, this will be: const data = await api.get('/posts', token);
            // For now, we use mock data
            const data = initialAllPosts.map(post => ({ ...post, liked: false }));
            setPosts(data);
        } catch (error) {
            console.error('[PostsContext:fetchPosts] Failed to fetch posts:', error.message);
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
            // await api.post(`/posts/${postId}/like`, {}, token);
        } catch (error) {
            console.error(`[PostsContext:handleLike] Failed to like post ${postId}:`, error.message);
        }
    }, [token]);

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
            // await api.post(`/posts/${postId}/save`, {}, token);
        } catch (error) {
            console.error(`[PostsContext:handleSave] Failed to save post ${postId}:`, error.message);
        }
    }, [token]);

    const value = useMemo(() => ({
        posts,
        loading,
        handleLike,
        handleSave,
        updateCommentCount,
        refreshPosts: fetchPosts
    }), [posts, loading, handleLike, handleSave, updateCommentCount, fetchPosts]);

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
