import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { chefFeedItems as initialFeedItems } from '../data/chefFeedData';

const ChefFeedContext = createContext();

export function ChefFeedProvider({ children }) {
    // Initialize feed items with their engagement data
    const [feedItems, setFeedItems] = useState(initialFeedItems);

    const handleLike = useCallback((feedItemId) => {
        try {
            setFeedItems(currentItems => 
                currentItems.map(item => {
                    if (item.id === feedItemId) {
                        return {
                            ...item,
                            likes: item.liked ? item.likes - 1 : item.likes + 1,
                            liked: !item.liked
                        };
                    }
                    return item;
                })
            );
        } catch (error) {
            console.error(`[ChefFeedContext:handleLike] Error liking item ${feedItemId}:`, error.message);
        }
    }, []);

    const updateCommentCount = useCallback((feedItemId) => {
        try {
            setFeedItems(currentItems =>
                currentItems.map(item => {
                    if (item.id === feedItemId) {
                        return { ...item, comments: item.comments + 1 };
                    }
                    return item;
                })
            );
        } catch (error) {
            console.error(`[ChefFeedContext:updateCommentCount] Error updating comment count for ${feedItemId}:`, error.message);
        }
    }, []);

    const handleSave = useCallback((feedItemId) => {
        try {
            setFeedItems(currentItems => 
                currentItems.map(item => {
                    if (item.id === feedItemId) {
                        return { ...item, saved: !item.saved };
                    }
                    return item;
                })
            );
        } catch (error) {
            console.error(`[ChefFeedContext:handleSave] Error saving item ${feedItemId}:`, error.message);
        }
    }, []);

    const value = useMemo(() => ({
        feedItems,
        handleLike,
        handleSave,
        updateCommentCount
    }), [feedItems, handleLike, handleSave, updateCommentCount]);

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
