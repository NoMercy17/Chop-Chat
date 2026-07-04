import { api } from './api';

/**
 * ChefService handles all professional Chef-related logic:
 * - Review requests
 * - Claiming requests (Chefs only)
 * - Posting reviews (Chefs only)
 * - Fetching the professional Chef Feed
 */

export const ChefService = {
    /**
     * User requests a review for one of their posts
     * @param {Object} requestData - { post_id, context, chef_filter }
     * @param {string} token - Auth token
     */
    requestReview: async (requestData, token) => {
        try {
            return await api.post('/chef/review-request', requestData, token);
        } catch (error) {
            console.error('[ChefService:requestReview] Error:', error.message);
            throw error;
        }
    },

    /**
     * Fetch pending review requests (for Chefs)
     * @param {string} token - Auth token
     */
    getPendingRequests: async (token) => {
        try {
            const data = await api.get('/chef/review-requests', token);
            return data.requests || [];
        } catch (error) {
            console.error('[ChefService:getPendingRequests] Error:', error.message);
            throw error;
        }
    },

    /**
     * Chef claims a pending review request
     * @param {number} requestId - ID of the request
     * @param {string} token - Auth token
     */
    claimRequest: async (requestId, token) => {
        try {
            return await api.patch(`/chef/review-requests/${requestId}/claim`, {}, token);
        } catch (error) {
            console.error('[ChefService:claimRequest] Error:', error.message);
            throw error;
        }
    },

    /**
     * Chef submits a review/reaction to a post
     * @param {Object} reviewData - { post_id, reaction_text, request_id }
     * @param {string} token - Auth token
     */
    postReview: async (reviewData, token) => {
        try {
            return await api.post('/chef/reviews', reviewData, token);
        } catch (error) {
            console.error('[ChefService:postReview] Error:', error.message);
            throw error;
        }
    },

    /**
     * Fetch the professional Chef Feed (all chef reactions)
     * @param {string} token - Auth token
     */
    getChefFeed: async (token) => {
        try {
            const data = await api.get('/chef/feed', token);
            return data.feedItems || [];
        } catch (error) {
            console.error('[ChefService:getChefFeed] Error:', error.message);
            throw error;
        }
    }
};
