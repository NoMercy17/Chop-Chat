import { createContext, useContext, useState, useCallback } from 'react';
import { allPosts as initialAllPosts } from '../data/postsData';

const PostsContext = createContext();

export function PostsProvider({ children }) {
    // Initialize all posts with liked: false
    const [posts, setPosts] = useState(
        initialAllPosts.map(post => ({ ...post, liked: false }))
    );

    const handleLike = useCallback((postId) => {
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
    }, []);

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

    const handleSave = useCallback((postId) => {
        setPosts(currentPosts => 
            currentPosts.map(post => {
                if (post.id === postId) {
                    return { ...post, saved: !post.saved };
                }
                return post;
            })
        );
    }, []);

    return (
        <PostsContext.Provider value={{ posts, handleLike, handleSave, updateCommentCount }}>
            {children}
        </PostsContext.Provider>
    );
}

export function usePosts() {
    const context = useContext(PostsContext);
    if (!context) {
        throw new Error('usePosts must be used within a PostsProvider');
    }
    return context;
}
