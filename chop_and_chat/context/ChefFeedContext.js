import { createContext, useContext, useState, useCallback } from 'react';
import { chefFeedItems as initialFeedItems } from '../data/chefFeedData';

const ChefFeedContext = createContext();

export function ChefFeedProvider({ children }) {
    // Initialize feed items with their engagement data
    const [feedItems, setFeedItems] = useState(initialFeedItems);

    const handleLike = useCallback((feedItemId) => {
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
    }, []);

    const updateCommentCount = useCallback((feedItemId) => {
        setFeedItems(currentItems =>
            currentItems.map(item => {
                if (item.id === feedItemId) {
                    return { ...item, comments: item.comments + 1 };
                }
                return item;
            })
        );
    }, []);

    const handleSave = useCallback((feedItemId) => {
        setFeedItems(currentItems => 
            currentItems.map(item => {
                if (item.id === feedItemId) {
                    return { ...item, saved: !item.saved };
                }
                return item;
            })
        );
    }, []);

    return (
        <ChefFeedContext.Provider value={{ feedItems, handleLike, handleSave, updateCommentCount }}>
            {children}
        </ChefFeedContext.Provider>
    );
}

export function useChefFeed() {
    const context = useContext(ChefFeedContext);
    if (!context) {
        throw new Error('useChefFeed must be used within a ChefFeedProvider');
    }
    return context;
}
