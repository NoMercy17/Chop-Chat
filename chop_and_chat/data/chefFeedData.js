// Import mock data from centralized source
import { 
    getInitials, 
    mockChefs, 
    mockUsers, 
    chefReactionTargetPosts, 
    mockFollowedChefIds,
    mockChefFeedItems,
    mockChefReactionComments
} from './mockData';

// Export helper function
export { getInitials };

// Export chefs from mockData (only 4 chefs now)
export const chefs = {
    gordon: mockChefs[0],
    maria: mockChefs[1],
    antoine: mockChefs[2],
    linda: mockChefs[3],
};

// Export community posts from mockData
export const communityPosts = chefReactionTargetPosts;

// Export post authors from mockData
export const postAuthors = {
    john: mockUsers[0],
    jane: mockUsers[1],
    mike: mockUsers[2],
    sarah: mockUsers[3],
};

// Chef feed items - imported from mockData (4 items with correct comment counts)
export const chefFeedItems = mockChefFeedItems;

// Chef reaction comments - imported from mockData
export const chefReactionComments = mockChefReactionComments;

// Export followed chef IDs from mockData
export const FOLLOWED_CHEF_IDS = mockFollowedChefIds;
