import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ... (themes stay exactly the same, I'll use placeholders for brevity in the tool call if allowed, but I must provide the exact text for the replace tool)
// Note: I will include the full theme definitions to ensure the replacement is valid.

// Light Theme Colors
export const lightTheme = {
  // Backgrounds
  background: '#F3F4F6',
  backgroundSecondary: '#F8FAFB',
  backgroundTertiary: '#FFFFFF',
  screenBackground: '#93C5FD',

  // Cards & Surfaces
  cardBackground: '#FFFFFF',
  cardBackgroundAlt: '#F9FAFB',
  cardBackgroundLight: '#FFFFFF',
  modalBackground: '#FFFFFF',
  overlayBackground: 'rgba(0, 0, 0, 0.5)',
  overlayBackgroundDark: 'rgba(0, 0, 0, 0.6)',

  // Post/Feed specific backgrounds
  postCardBackground: '#FFFFFF',
  postContentBackground: '#FFFFFF',  // Light mode stays white
  postMetaBackground: '#FFFFFF',
  postHeaderBackground: '#FFFFFF',
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

  // Profile specific
  profileImageBorder: '#E0EFFE',
  profileTextPrimary: '#FFFFFF',
  profileTextSecondary: '#E0EFFE',

  // Header title color
  headerTitleColor: '#111827',

  // Recipe info background
  recipeInfoBackground: '#FFFFFF',

  // Modal action buttons
  takePhotoButtonBg: '#F0FDF4',
  galleryButtonBg: '#EEF2FF',
  postFeedButtonBg: '#EFF6FF',
  aiRatingButtonBg: '#FFFBEB',
  chefReviewButtonBg: '#f7e9faff',
  cancelButtonBg: '#FEF2F2',

  // Chef/Community card
  chefCardBackground: '#FFFFFF',
  chefCardHeaderBg: '#FFFFFF',
  chefCardContentBg: '#FFFFFF',
  commentSectionBg: '#FFFFFF',
};

// Dark Theme Colors
export const darkTheme = {
  // Backgrounds
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  backgroundTertiary: '#3D4A5C',
  screenBackground: '#1a3a52',

  // Cards & Surfaces
  cardBackground: '#1E293B',
  cardBackgroundAlt: '#263242', 
  cardBackgroundLight: '#2D3A4F',  
  modalBackground: '#1E293B',
  overlayBackground: 'rgba(0, 0, 0, 0.7)',
  overlayBackgroundDark: 'rgba(0, 0, 0, 0.8)',

  // Post/Feed specific backgrounds 
  postCardBackground: '#1E293B',
  postContentBackground: '#2D3948',  // Darker shade for content area
  postMetaBackground: '#2D3948',     // Matches content background
  postHeaderBackground: '#1E293B',
  imageBackground: '#F9FAFB',  

  // Text Colors
  textPrimary: '#f1f5f9ee',
  textSecondary: '#cbd5e1d0', 
  textTertiary: '#94A3B8',  
  textInverse: '#f1f5f9ee',
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

  // Profile specific
  profileImageBorder: '#334155',
  profileTextPrimary: 'rgba(255, 255, 255, 0.85)',
  profileTextSecondary: 'rgba(255, 255, 255, 0.6)',

  // Header title
  headerTitleColor: '#f1f5f9ee',

  // Recipe info
  recipeInfoBackground: '#2D3948',  // Matches post content

  // Modal action buttons
  takePhotoButtonBg: '#1E3A2E',
  galleryButtonBg: '#1E2A4A',
  postFeedButtonBg: '#1E3A5F',
  aiRatingButtonBg: '#3D3520',
  chefReviewButtonBg: '#2E2535',
  cancelButtonBg: '#3D2020',

  // Chef/Community card
  chefCardBackground: '#1E293B',  
  chefCardHeaderBg: '#1E293B',
  chefCardContentBg: '#2D3948',  // Darker for content area
  commentSectionBg: '#2D3948',   // Matches content
};

const ThemeContext = createContext();


export function ThemeProvider({ children }) {
  // Use system color scheme as initial state to avoid flash
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();

    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only auto-update if we don't have a manual override stored?
      // For now, let's just listen and update if the user hasn't set a preference.
      // But usually, loadThemePreference will handle the override.
      checkSystemTheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const checkSystemTheme = async (systemScheme) => {
    const savedTheme = await AsyncStorage.getItem('theme_preference');
    if (savedTheme === null) {
      setIsDarkMode(systemScheme === 'dark');
    }
  };

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // If no preference, use system theme
        setIsDarkMode(Appearance.getColorScheme() === 'dark');
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

  const theme = useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);

  const value = useMemo(() => ({
    isDarkMode,
    theme,
    toggleTheme,
    setTheme,
    isLoading,
  }), [isDarkMode, theme, isLoading]);

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