import { api } from './api';

export const AiReviewService = {
  /**
   * Sends dish data to the backend for Gemini AI analysis.
   *
   * @param {object} params
   * @param {string} params.imageUrl   - Cloudinary secure_url of the uploaded dish
   * @param {string} params.title
   * @param {string} [params.description]
   * @param {string[]} [params.ingredients]
   * @param {string} [params.difficulty]
   * @param {string} [params.cookTime]
   * @param {string} params.token     - JWT bearer token
   *
   * @returns {Promise<{ review: AiReview, quota: { used: number, limit: number } }>}
   *
   * Throws with err.status:
   *   400 — missing required fields (shouldn't happen if called correctly)
   *   402 — daily quota exhausted; err.data.quota has { used, limit }
   *   503 — Gemini service unavailable; safe to retry
   *   500 — unexpected server error
   */
  
  analyze: ({ imageUrl, title, description, ingredients, difficulty, cookTime, token }) => {
    return api.post(
      '/ai/analyze',
      {
        image_url:   imageUrl,
        title,
        description: description  || '',
        ingredients: ingredients  || [],
        difficulty:  difficulty   || '',
        cook_time:   cookTime     || '',
      },
      token
    );
  },
};
