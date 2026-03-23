import React, { createContext, useState, useEffect, createRef, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export const AuthContext = createContext();
export const navigationRef = createRef();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for existing session on mount
    const loadSession = async () => {
      try {
        const raw = await AsyncStorage.getItem('session_user');
        if (raw) {
          const session = JSON.parse(raw);
          setUser(session.user);
          setToken(session.token);
        }
      } catch (e) {
        console.warn('[AuthContext:loadSession] Failed to restore session:', e.message);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const signIn = useCallback(async (sessionData) => {
    try {
      // sessionData should contain { user, token }
      await AsyncStorage.setItem('session_user', JSON.stringify(sessionData));
      setUser(sessionData.user);
      setToken(sessionData.token);
    } catch (error) {
      console.error('[AuthContext:signIn] Failed to save session:', error.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('session_user');
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('[AuthContext:signOut] Failed to clear session:', error.message);
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
      console.error('[AuthContext:login] Login request failed:', error.message);
      return { success: false, error: error.message };
    }
  }, [signIn]);

  const register = useCallback(async (userData) => {
    try {
      await api.post('/register', userData);
      return { success: true };
    } catch (error) {
      console.error('[AuthContext:register] Registration request failed:', error.message);
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
    register
  }), [user, token, loading, signIn, signOut, login, register]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
