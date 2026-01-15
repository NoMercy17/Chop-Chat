import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Light Theme Colors
export const lightTheme = {
  // Backgrounds
  background: '#F3F4F6',
  backgroundSecondary: '#F8FAFB',
  backgroundTertiary: '#FFFFFF',
  headerBackground: '#5B9CF6',
  
  // Cards & Surfaces
  cardBackground: '#FFFFFF',
  cardBackgroundAlt: '#F9FAFB',
  cardBackgroundLight: '#FFFFFF',  // Same as cardBackground for light mode
  modalBackground: '#FFFFFF',
  overlayBackground: 'rgba(0, 0, 0, 0.5)',
  overlayBackgroundDark: 'rgba(0, 0, 0, 0.6)',
  
  // Post/Feed specific backgrounds
  postCardBackground: '#FFFFFF',
  postContentBackground: '#FFFFFF',
  postMetaBackground: '#FFFFFF',
  postHeaderBackground: '#FFFFFF',  // Header section (author info)
  imageBackground: '#F3F4F6',
  
  // Text Colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textMuted: '#374151',
  
  // Primary Colors (Blue)
  primary: '#3B82F6',
  primaryLight: '#93C5FD',
  primaryLighter: '#DBEAFE',
  primaryLightest: '#EFF6FF',
  primaryDark: '#2563EB',
  
  // Accent Colors
  accent: '#5B9CF6',
  accentLight: '#E0EFFE',
  
  // Status Colors
  success: '#059669',
  successLight: '#D1FAE5',
  successLighter: '#F0FDF4',
  
  warning: '#D97706',
  warningLight: '#FEF3C7',
  
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  dangerLighter: '#FEF2F2',
  dangerMuted: '#dc2626c5',
  dangerAccent: '#FCA5A5',
  
  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
  
  // Shadows
  shadowColor: '#000',
  shadowColorPrimary: '#3B82F6',
  
  // Input
  inputBackground: '#F9FAFB',
  inputBorder: '#E5E7EB',
  placeholderText: '#9CA3AF',
  
  // Switch
  switchTrackOff: '#E5E7EB',
  switchTrackOn: '#93C5FD',
  switchThumbOff: '#9CA3AF',
  switchThumbOn: '#3B82F6',
  
  // Specific Component Colors
  likeColor: '#b90808ff',
  saveColor: '#b90808ff',
  
  // Chef/Community card specific
  chefCardBackground: '#FFFFFF',
  chefCardHeaderBg: '#FFFFFF',  // Header section
  chefCardContentBg: '#FFFFFF',
  commentSectionBg: '#F9FAFB',
};

// Dark Theme Colors
export const darkTheme = {
  // Backgrounds
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  backgroundTertiary: '#334155',
  headerBackground: '#2563EB',  
  
  // Cards & Surfaces
  cardBackground: '#1E293B',
  cardBackgroundAlt: '#334155',
  cardBackgroundLight: '#2D3A4F',  
  modalBackground: '#1E293B',
  overlayBackground: 'rgba(0, 0, 0, 0.7)',
  overlayBackgroundDark: 'rgba(0, 0, 0, 0.8)',
  
  // Post/Feed specific backgrounds 
  postCardBackground: '#1E293B',
  postContentBackground: '#3D4A5C',  // Lighter grey for content/comments section
  postMetaBackground: '#3D4A5C',  
  postHeaderBackground: '#1E293B',  // Darker for "reacted to" header section
  imageBackground: '#F9FAFB',  // Keep image placeholder light
  
  // Text Colors
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1', 
  textTertiary: '#94A3B8',  
  textInverse: '#0F172A',
  textMuted: '#CBD5E1',
  
  // Primary Colors 
  primary: '#60A5FA',
  primaryLight: '#3B82F6',
  primaryLighter: '#1E3A5F',
  primaryLightest: '#172554',
  primaryDark: '#93C5FD',
  
  // Accent Colors
  accent: '#60A5FA',
  accentLight: '#1E3A5F',
  
  // Status Colors
  success: '#34D399',
  successLight: '#064E3B',
  successLighter: '#022C22',
  
  warning: '#FBBF24',
  warningLight: '#78350F',
  
  danger: '#F87171',
  dangerLight: '#7F1D1D',
  dangerLighter: '#450A0A',
  dangerMuted: '#F87171',
  dangerAccent: '#DC2626',
  
  // Borders
  border: '#334155',
  borderLight: '#1E293B',
  borderDark: '#475569',
  
  // Shadows
  shadowColor: '#000',
  shadowColorPrimary: '#1E40AF',
  
  // Input
  inputBackground: '#334155',
  inputBorder: '#475569',
  placeholderText: '#64748B',
  
  // Switch
  switchTrackOff: '#475569',
  switchTrackOn: '#1E40AF',
  switchThumbOff: '#64748B',
  switchThumbOn: '#60A5FA',
  
  // Specific Component Colors
  likeColor: '#F87171',
  saveColor: '#F87171',
  
  // Chef/Community card specific 
  chefCardBackground: '#1E293B',  
  chefCardHeaderBg: '#1E293B',  // Darker header section (reacted to...)
  chefCardContentBg: '#3D4A5C',  // Lighter content area (comment text)
  commentSectionBg: '#3D4A5C',  // Same as content
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme_preference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const setTheme = async (dark) => {
    try {
      setIsDarkMode(dark);
      await AsyncStorage.setItem('theme_preference', dark ? 'dark' : 'light');
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    isDarkMode,
    theme,
    toggleTheme,
    setTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
