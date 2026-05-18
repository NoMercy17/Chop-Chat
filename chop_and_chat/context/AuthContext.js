import React, { createContext, useState, useEffect, createRef, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { api } from '../services/api';

export const AuthContext = createContext();
export const navigationRef = createRef();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  /**
   * Step 1: Role Normalization Helper
   * Ensures that if the backend returns a 'role' string, we also have a consistent 'isChef' boolean
   * for the UI logic to use throughout the app.
   */
  const normalizeUser = (userData) => {
    if (!userData) return null;
    return {
      ...userData,
      isChef: userData.isChef || userData.role === 'chef',
      email_verified: userData.email_verified ?? true,
    };
  };

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('session_user');
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('[AuthContext:signOut] Failed to clear session:', error.message);
    }
  }, []);

  useEffect(() => {
    // Check for existing session on mount
    const loadSession = async () => {
      try {
        const raw = await AsyncStorage.getItem('session_user');
        if (raw) {
          const session = JSON.parse(raw);
          // Step 2: Normalize user data when restoring session
          setUser(normalizeUser(session.user));
          setToken(session.token);
        }
      } catch (e) {
        console.warn('[AuthContext:loadSession] Failed to restore session:', e.message);
      } finally {
        setLoading(false);
      }
    };
    loadSession();

    // Listen for global auth errors
    const subscription = DeviceEventEmitter.addListener('auth_error_logout', () => {
      console.warn('[AuthContext] Global auth error received. Logging out.');
      signOut();
    });

    return () => {
      subscription.remove();
    };
  }, [signOut]);

  const signIn = useCallback(async (sessionData) => {
    try {
      // Step 3: Normalize user data before saving to AsyncStorage and State
      const normalizedUser = normalizeUser(sessionData.user);
      const dataToSave = { ...sessionData, user: normalizedUser };
      
      await AsyncStorage.setItem('session_user', JSON.stringify(dataToSave));
      setUser(normalizedUser);
      setToken(sessionData.token);
    } catch (error) {
      console.error('[AuthContext:signIn] Failed to save session:', error.message);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const data = await api.post('/login', { email, password });
      if (data.token && data.user) {
        await signIn(data);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      if (error.data?.error === 'EMAIL_NOT_VERIFIED') {
        return { success: false, error: 'EMAIL_NOT_VERIFIED', email };
      }
      console.error('[AuthContext:login] Login request failed:', error.message);
      return { success: false, error: error.message };
    }
  }, [signIn]);

  const register = useCallback(async (userData) => {
    try {
      await api.post('/register', userData);
      return { success: true };
    } catch (error) {
      console.error('[AuthContext:register] Request failed:', error.message);
      return { success: false, error: error.message };
    }
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    signIn,
    signOut,
    login,
    register,
  }), [user, token, loading, signIn, signOut, login, register]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
