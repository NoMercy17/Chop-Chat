import { env } from '../utils/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, DeviceEventEmitter } from 'react-native';

/**
 * Core API Service for handling network requests to the backend.
 * Provides consistent error handling and base URL configuration.
*/


// Helper to build full URL
const getUrl = (endpoint) => `${env.API_URL}${endpoint}`;


// Helper to get auth headers if a token exists
// We will update this later when refactoring AuthContext to store the token securely.
const getHeaders = (token = null, isFormData = false) => {
    const headers = {};
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const api = {
    get: async (endpoint, token = null) => {
        const response = await fetch(getUrl(endpoint), {
            method: 'GET',
            headers: getHeaders(token),
        });
        return handleResponse(response, !!token);
    },

    post: async (endpoint, data, token = null) => {
        const response = await fetch(getUrl(endpoint), {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(data),
        });
        return handleResponse(response, !!token);
    },

    put: async (endpoint, data, token = null) => {
        const response = await fetch(getUrl(endpoint), {
            method: 'PUT',
            headers: getHeaders(token),
            body: JSON.stringify(data),
        });
        return handleResponse(response, !!token);
    },

    patch: async (endpoint, data, token = null) => {
        const response = await fetch(getUrl(endpoint), {
            method: 'PATCH',
            headers: getHeaders(token),
            body: JSON.stringify(data),
        });
        return handleResponse(response, !!token);
    },

    delete: async (endpoint, token = null) => {
        const response = await fetch(getUrl(endpoint), {
            method: 'DELETE',
            headers: getHeaders(token),
        });
        return handleResponse(response, !!token);
    },

    // For uploading formData (if we ever need to send files directly to backend and not to Cloudinary)
    postFormData: async (endpoint, formData, token = null) => {
        const response = await fetch(getUrl(endpoint), {
            method: 'POST',
            headers: getHeaders(token, true),
            body: formData,
        });
        return handleResponse(response, !!token);
    }
};

// Centralized response handling
async function handleResponse(response, wasAuthenticated = false) {
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        if (response.status === 401 && wasAuthenticated) {
            console.warn('[api.js] 401 received. Clearing session.');
            await AsyncStorage.removeItem('session_user');
            DeviceEventEmitter.emit('auth_error_logout');
        }

        const error = new Error(data.message || data.error || 'API request failed');
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}
