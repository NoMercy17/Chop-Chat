import React, { useContext, useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Modal, TextInput, Switch, Alert, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { wp, hp, fp, SPACING } from "../utils/responsive";
import CameraScreen, { uploadImage } from "../utils/photoHandling";
import { uploadToCloudinary } from "../utils/cloudinaryUploads";
import { env } from "../utils/env";

export default function ProfileScreen({ navigation }) {
  const auth = useContext(AuthContext);
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Settings Modal State
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [activeSettingTab, setActiveSettingTab] = useState(null);
  
  // Profile Image Modal State
  const [imageSourceModalVisible, setImageSourceModalVisible] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Bio editing
  const [bio, setBio] = useState("Food enthusiast");
  const [tempBio, setTempBio] = useState("");
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    recipeMatches: true,
    chefReviews: true,
    likesComments: true,
    newFollowers: false,
  });

  // Load user data on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Reload profile whenever this screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      let token = await AsyncStorage.getItem('userToken');
      // Fallback to session_user if userToken is not set (compatibility with LoginScreen)
      if (!token) {
        const session = await AsyncStorage.getItem('session_user');
        if (session) {
          token = JSON.parse(session).token;
        }
      }

      if (!token) {
        console.log('❌ No token found');
        return;
      }

      console.log('📥 Loading user profile...');
      const response = await fetch(`${env.API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile loaded:', data.user);
        
        if (data.user.profile_photo) {
          console.log('📸 Profile photo URL:', data.user.profile_photo);
          setProfileImage(data.user.profile_photo);
        } else {
          console.log('⚠️ No profile photo');
          setProfileImage(null);
        }
        
        if (data.user.bio) {
          setBio(data.user.bio);
        }
      } else {
        console.error('❌ Failed to load profile, status:', response.status);
      }
    } catch (error) {
      console.error('❌ Failed to load profile:', error);
    }
  };

  const openSettings = () => {
    setSettingsVisible(true);
    setActiveSettingTab(null);
  };

  const closeSettings = () => {
    setSettingsVisible(false);
    setActiveSettingTab(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSaveBio = async () => {
    try {
      let token = await AsyncStorage.getItem('userToken');
      if (!token) {
        const session = await AsyncStorage.getItem('session_user');
        if (session) token = JSON.parse(session).token;
      }

      const response = await fetch(`${env.API_URL}/users/bio`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bio: tempBio })
      });

      if (response.ok) {
        setBio(tempBio);
        setActiveSettingTab(null);
        Alert.alert("Success", "Bio updated successfully");
      } else {
        const data = await response.json();
        Alert.alert("Error", data.error || "Failed to update bio");
      }
    } catch (error) {
      console.error('Error updating bio:', error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    // TODO: API call to change password
    Alert.alert("Success", "Password changed successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setActiveSettingTab(null);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your recipes, posts, and data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            // TODO: API call to delete account
            auth.signOut();
          }
        }
      ]
    );
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    // TODO: API call to update notification preferences
  };

  // Profile Image Handlers
  const handleChangeProfileImage = () => {
    setImageSourceModalVisible(true);
  };

  const handleTakePhoto = () => {
    setImageSourceModalVisible(false);
    setTimeout(() => {
      setCameraModalVisible(true);
    }, 300);
  };

  const handlePhotoTaken = async (uri) => {
    console.log('Profile photo captured:', uri);
    setProfileImage(uri); // Show local image immediately
    setCameraModalVisible(false);
    
    // Upload to Cloudinary and save to backend
    await uploadProfilePhoto(uri);
  };

  const handleAccessGallery = async () => {
    const uri = await uploadImage('gallery');
    setImageSourceModalVisible(false);
    
    if (uri) {
      setProfileImage(uri); // Show local image immediately
      await uploadProfilePhoto(uri);
    }
  };

  const uploadProfilePhoto = async (localUri) => {
    try {
      setIsUploading(true);
      
      // Step 1: Upload to Cloudinary
      console.log('📤 Uploading to Cloudinary...');
      const cloudinaryUrl = await uploadToCloudinary(localUri, 'profile_photos');
      
      if (!cloudinaryUrl) {
        Alert.alert('Error', 'Failed to upload photo');
        setIsUploading(false);
        return;
      }
      
      // Step 2: Save URL to backend
      console.log('💾 Saving to database...');
      let token = await AsyncStorage.getItem('userToken');
      if (!token) {
        const session = await AsyncStorage.getItem('session_user');
        if (session) token = JSON.parse(session).token;
      }
      
      const response = await fetch(`${env.API_URL}/users/profile-photo`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          photo_url: cloudinaryUrl
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Profile photo saved!');
        setProfileImage(cloudinaryUrl); // Update to use Cloudinary URL
        Alert.alert('Success', 'Profile photo updated!');
        
        // Step 3: Reload profile to ensure data persists
        await loadUserProfile();
      } else {
        Alert.alert('Error', data.error || 'Failed to save photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsUploading(false);
    }
  };

  const renderSettingsContent = () => {
    if (activeSettingTab === 'bio') {
      return (
        <>
          <View style={styles.settingTabContent}>
            <Text style={styles.settingTabTitle}>Update Bio</Text>
            <Text style={styles.settingTabSubtitle}>Tell others about your cooking style</Text>
            <TextInput
              style={styles.bioInput}
              value={tempBio}
              onChangeText={setTempBio}
              placeholder="Enter your bio..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={50}
            />
            <Text style={styles.charCount}>{tempBio.length}/50</Text>
            <View style={styles.settingTabButtons}>
              <Pressable 
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
                onPress={() => setActiveSettingTab(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={({ pressed }) => [styles.saveBtn, pressed && styles.btnPressed]}
                onPress={handleSaveBio}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </>
      );
    }

    if (activeSettingTab === 'password') {
      return (
        <>
          <View style={styles.settingTabContent}>
            <Text style={styles.settingTabTitle}>Change Password</Text>
            <Text style={styles.settingTabSubtitle}>Enter your current and new password</Text>
            <TextInput
              style={styles.passwordInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
            <TextInput
              style={styles.passwordInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
            <View style={styles.settingTabButtons}>
              <Pressable 
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  setActiveSettingTab(null);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={({ pressed }) => [styles.saveBtn, pressed && styles.btnPressed]}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveBtnText}>Update</Text>
              </Pressable>
            </View>
          </View>
        </>
      );
    }

    if (activeSettingTab === 'notifications') {
      return (
        <>
          <View style={styles.settingTabContent}>
            <Text style={styles.settingTabTitle}>Notifications</Text>
            <Text style={styles.settingTabSubtitle}>Choose what you want to be notified about</Text>
            
            <View style={styles.notificationsList}>
              <View style={styles.notificationItem}>
                <View style={styles.notificationInfo}>
                  <Ionicons name="restaurant-outline" size={fp(20)} color="#3B82F6" />
                  <Text style={styles.notificationLabel}>Recipe Matches</Text>
                </View>
                <Switch
                  value={notifications.recipeMatches}
                  onValueChange={() => toggleNotification('recipeMatches')}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={notifications.recipeMatches ? '#3B82F6' : '#9CA3AF'}
                />
              </View>
              
              <View style={styles.notificationItem}>
                <View style={styles.notificationInfo}>
                  <Ionicons name="star-outline" size={fp(20)} color="#3B82F6" />
                  <Text style={styles.notificationLabel}>Chef Reviews</Text>
                </View>
                <Switch
                  value={notifications.chefReviews}
                  onValueChange={() => toggleNotification('chefReviews')}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={notifications.chefReviews ? '#3B82F6' : '#9CA3AF'}
                />
              </View>
              
              <View style={styles.notificationItem}>
                <View style={styles.notificationInfo}>
                  <Ionicons name="heart-outline" size={fp(20)} color="#3B82F6" />
                  <Text style={styles.notificationLabel}>Likes & Comments</Text>
                </View>
                <Switch
                  value={notifications.likesComments}
                  onValueChange={() => toggleNotification('likesComments')}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={notifications.likesComments ? '#3B82F6' : '#9CA3AF'}
                />
              </View>
              
              <View style={styles.notificationItem}>
                <View style={styles.notificationInfo}>
                  <Ionicons name="people-outline" size={fp(20)} color="#3B82F6" />
                  <Text style={styles.notificationLabel}>New Followers</Text>
                </View>
                <Switch
                  value={notifications.newFollowers}
                  onValueChange={() => toggleNotification('newFollowers')}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={notifications.newFollowers ? '#3B82F6' : '#9CA3AF'}
                />
              </View>
            </View>
            
            <Pressable 
              style={({ pressed }) => [styles.backToSettingsBtn, pressed && styles.btnPressed]}
              onPress={() => setActiveSettingTab(null)}
            >
              <Ionicons name="arrow-back" size={fp(18)} color="#374151" />
              <Text style={styles.backToSettingsBtnText}>Back to Settings</Text>
            </Pressable>
          </View>
        </>
      );
    }

    // Main settings menu
    return (
      <>
        <View style={[styles.settingsMenu, { backgroundColor: theme.modalBackground }]}>
          <View style={[styles.settingsHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.settingsTitle, { color: theme.textPrimary }]}>Settings</Text>
            <Text style={[styles.settingsSubtitle, { color: theme.textSecondary }]}>Manage your account preferences</Text>
          </View>

          <View style={styles.settingsOptions}>
            <Pressable 
              style={({ pressed }) => [styles.settingsOption, pressed && styles.settingsOptionPressed]}
              onPress={() => {
                setTempBio(bio);
                setActiveSettingTab('bio');
              }}
            >
              <View style={styles.settingsOptionLeft}>
                <View style={[styles.settingsIconContainer, { backgroundColor: isDarkMode ? '#1E3A5F' : '#DBEAFE' }]}>
                  <Ionicons name="pencil-outline" size={fp(20)} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.settingsOptionTitle, { color: theme.textPrimary }]}>Update Bio</Text>
                  <Text style={[styles.settingsOptionDesc, { color: theme.textSecondary }]}>Change your profile description</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={fp(20)} color={theme.textTertiary} />
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.settingsOption, pressed && styles.settingsOptionPressed]}
              onPress={() => setActiveSettingTab('password')}
            >
              <View style={styles.settingsOptionLeft}>
                <View style={[styles.settingsIconContainer, { backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7' }]}>
                  <Ionicons name="lock-closed-outline" size={fp(20)} color={theme.warning} />
                </View>
                <View>
                  <Text style={[styles.settingsOptionTitle, { color: theme.textPrimary }]}>Change Password</Text>
                  <Text style={[styles.settingsOptionDesc, { color: theme.textSecondary }]}>Update your account password</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={fp(20)} color={theme.textTertiary} />
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.settingsOption, pressed && styles.settingsOptionPressed]}
              onPress={() => setActiveSettingTab('notifications')}
            >
              <View style={styles.settingsOptionLeft}>
                <View style={[styles.settingsIconContainer, { backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5' }]}>
                  <Ionicons name="notifications-outline" size={fp(20)} color={theme.success} />
                </View>
                <View>
                  <Text style={[styles.settingsOptionTitle, { color: theme.textPrimary }]}>Notifications</Text>
                  <Text style={[styles.settingsOptionDesc, { color: theme.textSecondary }]}>Manage notification preferences</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={fp(20)} color={theme.textTertiary} />
            </Pressable>

            {/* Dark Mode Toggle */}
            <View style={styles.darkModeRow}>
              <View style={styles.settingsOptionLeft}>
                <View style={[styles.settingsIconContainer, { backgroundColor: isDarkMode ? '#312E81' : '#EDE9FE' }]}>
                  <Ionicons name={isDarkMode ? "moon" : "moon-outline"} size={fp(20)} color={isDarkMode ? '#A78BFA' : '#7C3AED'} />
                </View>
                <View>
                  <Text style={[styles.settingsOptionTitle, { color: theme.textPrimary }]}>Dark Mode</Text>
                  <Text style={[styles.settingsOptionDesc, { color: theme.textSecondary }]}>{isDarkMode ? 'Currently enabled' : 'Currently disabled'}</Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                thumbColor={isDarkMode ? '#A78BFA' : '#9CA3AF'}
              />
            </View>

            <View style={[styles.settingsDivider, { backgroundColor: theme.border }]} />

            <Pressable 
              style={({ pressed }) => [styles.settingsOption, pressed && styles.settingsOptionPressed]}
              onPress={handleDeleteAccount}
            >
              <View style={styles.settingsOptionLeft}>
                <View style={[styles.settingsIconContainer, { backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2' }]}>
                  <Ionicons name="trash-outline" size={fp(20)} color={theme.danger} />
                </View>
                <View>
                  <Text style={[styles.settingsOptionTitle, { color: theme.danger }]}>Delete Account</Text>
                  <Text style={[styles.settingsOptionDesc, { color: theme.textSecondary }]}>Permanently remove your account</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={fp(20)} color={theme.dangerAccent} />
            </Pressable>
          </View>
        </View>

        <Pressable 
          style={({ pressed }) => [styles.closeModalBtn, { backgroundColor: theme.border }, pressed && styles.btnPressed]}
          onPress={closeSettings}
        >
          <Text style={[styles.closeModalBtnText, { color: theme.textPrimary }]}>Close</Text>
        </Pressable>
      </>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      
      {/* Profile Header */}
      <View style={[styles.header, { backgroundColor: theme.screenBackground }]}>
        {/* Back Button */}
        <Pressable 
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed
          ]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={fp(24)} color="rgba(255, 255, 255, 0.85)" />
        </Pressable>
        
        <View style={styles.profileImageContainer}>
          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
          <Image 
            source={profileImage ? { uri: profileImage } : require("../assets/favicon.png")}
            style={[styles.profileImage, { borderColor: theme.profileImageBorder }]}
          />
          <Pressable 
            style={[styles.editImageBadge, { backgroundColor: theme.primary }]}
            onPress={handleChangeProfileImage}
            disabled={isUploading}
          >
            <Ionicons name="add" size={fp(16)} color={theme.textInverse} />
          </Pressable>
        </View>
        <Text style={[styles.username, { color: theme.profileTextPrimary }]}>Antonio</Text>
        <Text style={[styles.bio, { color: theme.profileTextSecondary }]} numberOfLines={1} ellipsizeMode="tail">
          {bio}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border, shadowColor: theme.shadowColorPrimary }]}>
          <Text style={[styles.statNumber, { color: theme.textPrimary }]}>10</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Recipes posted</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border, shadowColor: theme.shadowColorPrimary }]}>
          <Text style={[styles.statNumber, { color: theme.textPrimary }]}>23</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border, shadowColor: theme.shadowColorPrimary }]}>
          <Text style={[styles.statNumber, { color: theme.textPrimary }]}>18</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Following</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={[styles.menuContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border, shadowColor: theme.shadowColorPrimary }]}>
        <Pressable 
          style={({ pressed }) => [
            styles.menuItem,
            { borderBottomColor: theme.borderLight },
            pressed && [styles.menuItemPressed, { backgroundColor: theme.primaryLightest }]
          ]}
          onPress={() => navigation.navigate("MyRecipes")}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primaryLightest }]}>
              <Ionicons name="list-outline" size={fp(22)} color={theme.primary} />
            </View>
            <Text style={[styles.menuText, { color: theme.textPrimary }]}>My Recipes</Text>
          </View>
          <Ionicons name="chevron-forward" size={fp(20)} color={theme.textTertiary} />
        </Pressable>

        <Pressable 
          style={({ pressed }) => [
            styles.menuItem,
            { borderBottomColor: theme.borderLight },
            pressed && [styles.menuItemPressed, { backgroundColor: theme.primaryLightest }]
          ]}
          onPress={() => navigation.navigate("FavoriteRecipes")}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primaryLightest }]}>
              <Ionicons name="heart-outline" size={fp(22)} color={theme.primary} />
            </View>
            <Text style={[styles.menuText, { color: theme.textPrimary }]}>Favorite Recipes</Text>
          </View>
          <Ionicons name="chevron-forward" size={fp(20)} color={theme.textTertiary} />
        </Pressable>

        <Pressable 
          style={({ pressed }) => [
            styles.menuItem,
            { borderBottomColor: theme.borderLight },
            pressed && [styles.menuItemPressed, { backgroundColor: theme.primaryLightest }]
          ]}
          onPress={openSettings}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primaryLightest }]}>
              <Ionicons name="settings-outline" size={fp(22)} color={theme.primary} />
            </View>
            <Text style={[styles.menuText, { color: theme.textPrimary }]}>Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={fp(20)} color={theme.textTertiary} />
        </Pressable>
      </View>

      {/* Profile Image Source Modal */}
      <Modal 
        visible={imageSourceModalVisible} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setImageSourceModalVisible(false)}
      >
        <Pressable 
          style={[styles.actionModalOverlay, { backgroundColor: theme.overlayBackgroundDark }]}
          onPress={() => setImageSourceModalVisible(false)}
        >
          <Pressable style={[styles.actionModalCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.actionModalHeader}>
              <Text style={[styles.actionModalTitle, { color: theme.textPrimary }]}>Change Profile Picture</Text>
              <Text style={[styles.actionModalSubtitle, { color: theme.textSecondary }]}>Choose how to add your photo</Text>
            </View>

            <View style={styles.actionButtonsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: theme.successLighter },
                  pressed && styles.actionButtonPressed
                ]}
                onPress={handleTakePhoto}
              >
                <View style={styles.actionTextContainer}>
                  <Text style={[styles.actionButtonTitle, { color: theme.textPrimary }]}>Take Photo</Text>
                  <Text style={[styles.actionButtonSubtitle, { color: theme.textSecondary }]}>Capture with your camera</Text>
                </View>
                <Ionicons name="camera-outline" size={fp(24)} color={theme.success} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: theme.primaryLightest },
                  pressed && styles.actionButtonPressed
                ]}
                onPress={handleAccessGallery}
              >
                <View style={styles.actionTextContainer}>
                  <Text style={[styles.actionButtonTitle, { color: theme.textPrimary }]}>Access Gallery</Text>
                  <Text style={[styles.actionButtonSubtitle, { color: theme.textSecondary }]}>Choose from your photos</Text>
                </View>
                <Ionicons name="images-outline" size={fp(24)} color={theme.primary} />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                { backgroundColor: theme.dangerLighter },
                pressed && styles.cancelButtonPressed
              ]}
              onPress={() => setImageSourceModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.dangerMuted }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Camera Modal */}
      <Modal 
        visible={cameraModalVisible} 
        animationType="slide"
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <CameraScreen 
          onPhotoTaken={handlePhotoTaken}
          onClose={() => setCameraModalVisible(false)}
        />
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeSettings}
      >
        <TouchableWithoutFeedback onPress={closeSettings}>
          <View style={[styles.modalOverlay, { backgroundColor: theme.overlayBackground }]}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalKeyboardView}
            >
              <TouchableWithoutFeedback>
                <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                  {renderSettingsContent()}
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Logout */}
      <Pressable 
        style={({ pressed }) => [
          styles.logoutButton,
          { backgroundColor: theme.dangerLighter, borderColor: theme.dangerLight },
          pressed && styles.logoutButtonPressed
        ]}
        onPress={() => auth.signOut()}
      >
        <Text style={[styles.logoutText, { color: theme.dangerMuted }]}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#5B9CF6",
    paddingTop: hp(20),
    paddingBottom: hp(28),
    borderBottomRightRadius: wp(24),
    borderBottomLeftRadius: wp(24),
  },
  backButton: {
    position: 'absolute',
    top: hp(15),
    left: wp(15),
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  profileImageContainer: {
    position: "relative",
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: wp(45),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profileImage: {
    width: wp(90),
    height: wp(90),
    borderRadius: wp(45),
    borderWidth: 3,
    borderColor: "#E0EFFE",
  },
  editImageBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  username: {
    fontSize: fp(24),
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: hp(2),
    letterSpacing: -0.3,
  },
  bio: {
    color: "#E0EFFE",
    fontSize: fp(14),
    fontWeight: "500",
    marginBottom: hp(4),
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenPadding,
    marginTop: hp(-26),
    gap: SPACING.itemGap,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8FAFB",
    padding: wp(16),
    borderRadius: SPACING.radiusLarge,
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: hp(4) },
    shadowOpacity: 0.20,
    shadowRadius: wp(16),
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statNumber: {
    fontSize: fp(32),
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: fp(13),
    marginTop: hp(6),
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
  menuContainer: {
    marginTop: SPACING.sectionGap,
    marginHorizontal: SPACING.screenPadding,
    backgroundColor: "#F8FAFB",
    borderRadius: SPACING.radiusLarge,
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: hp(4) },
    shadowOpacity: 0.08,
    shadowRadius: wp(16),
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: hp(16),
    paddingHorizontal: SPACING.cardPadding,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuItemPressed: {
    backgroundColor: "#EFF6FF",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(16),
  },
  iconContainer: {
    width: wp(40),
    height: wp(40),
    borderRadius: SPACING.radiusSmall,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    fontSize: fp(16),
    color: "#111827",
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: SPACING.sectionGap,
    marginHorizontal: SPACING.screenPadding,
    marginBottom: hp(40),
    paddingVertical: hp(16),
    backgroundColor: "#FEF2F2",
    borderRadius: SPACING.radiusMedium,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  logoutText: {
    color: "#dc2626c5",
    fontSize: fp(16),
    fontWeight: "700",
  },

  // Profile Image Modal Styles
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(24),
  },
  actionModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(24),
    width: '100%',
    maxWidth: wp(340),
    paddingVertical: hp(24),
    paddingHorizontal: wp(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp(8) },
    shadowOpacity: 0.15,
    shadowRadius: wp(24),
    elevation: 12,
  },
  actionModalHeader: {
    alignItems: 'center',
    marginBottom: hp(24),
  },
  actionModalTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: hp(4),
  },
  actionModalSubtitle: {
    fontSize: fp(14),
    color: '#6B7280',
  },
  actionButtonsContainer: {
    gap: hp(8),
    marginBottom: hp(16),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(16),
    paddingHorizontal: wp(16),
    borderRadius: wp(12),
    backgroundColor: '#F9FAFB',
  },
  takePhotoButton: {
    backgroundColor: '#F0FDF4',
  },
  galleryButton: {
    backgroundColor: '#EEF2FF',
  },
  actionButtonPressed: {
    backgroundColor: '#F3F4F6',
    transform: [{ scale: 0.98 }],
  },
  actionTextContainer: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: fp(16),
    fontWeight: '600',
    color: '#111827',
  },
  actionButtonSubtitle: {
    fontSize: fp(13),
    color: '#6B7280',
    marginTop: hp(2),
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: hp(14),
    borderRadius: wp(12),
    backgroundColor: '#FEF2F2',
  },
  cancelButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  cancelButtonText: {
    color: "#dc2626c5",
    fontSize: fp(16),
    fontWeight: "700",
  },

  // Settings Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    width: '100%',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp(24),
    borderTopRightRadius: wp(24),
    paddingBottom: hp(30),
    maxHeight: hp(650),
  },
  settingsMenu: {
    paddingTop: hp(8),
  },
  settingsHeader: {
    paddingHorizontal: wp(24),
    paddingTop: hp(20),
    paddingBottom: hp(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsTitle: {
    fontSize: fp(24),
    fontWeight: '700',
    color: '#111827',
  },
  settingsSubtitle: {
    fontSize: fp(14),
    color: '#6B7280',
    marginTop: hp(4),
  },
  settingsOptions: {
    paddingHorizontal: wp(16),
    paddingTop: hp(12),
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(14),
    paddingHorizontal: wp(12),
    borderRadius: wp(12),
    marginBottom: hp(4),
  },
  settingsOptionPressed: {
    backgroundColor: '#F9FAFB',
  },
  settingsOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(14),
  },
  settingsIconContainer: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsOptionTitle: {
    fontSize: fp(16),
    fontWeight: '600',
    color: '#111827',
  },
  settingsOptionDesc: {
    fontSize: fp(12),
    color: '#9CA3AF',
    marginTop: hp(2),
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: hp(12),
    marginHorizontal: wp(12),
  },
  closeModalBtn: {
    marginTop: hp(8),
    marginHorizontal: wp(24),
    paddingVertical: hp(14),
    backgroundColor: '#F3F4F6',
    borderRadius: wp(12),
    alignItems: 'center',
  },
  closeModalBtnText: {
    fontSize: fp(16),
    fontWeight: '600',
    color: '#374151',
  },
  btnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  // Setting Tab Content Styles
  settingTabContent: {
    padding: wp(24),
  },
  settingTabTitle: {
    fontSize: fp(22),
    fontWeight: '700',
    color: '#111827',
    marginBottom: hp(4),
  },
  settingTabSubtitle: {
    fontSize: fp(14),
    color: '#6B7280',
    marginBottom: hp(20),
  },
  bioInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp(12),
    padding: wp(16),
    fontSize: fp(15),
    color: '#111827',
    minHeight: hp(100),
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  charCount: {
    fontSize: fp(12),
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: hp(8),
  },
  passwordInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp(12),
    padding: wp(16),
    fontSize: fp(15),
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: hp(12),
  },
  settingTabButtons: {
    flexDirection: 'row',
    gap: wp(12),
    marginTop: hp(20),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: hp(14),
    backgroundColor: '#F3F4F6',
    borderRadius: wp(12),
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: fp(15),
    fontWeight: '600',
    color: '#6B7280',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: hp(14),
    backgroundColor: '#3B82F6',
    borderRadius: wp(12),
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: fp(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Notifications Styles
  notificationsList: {
    gap: hp(4),
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(14),
    paddingHorizontal: wp(12),
    backgroundColor: '#F9FAFB',
    borderRadius: wp(12),
    marginBottom: hp(8),
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  notificationLabel: {
    fontSize: fp(15),
    fontWeight: '500',
    color: '#374151',
  },
  backToSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    marginTop: hp(20),
    paddingVertical: hp(14),
    backgroundColor: '#F3F4F6',
    borderRadius: wp(12),
  },
  backToSettingsBtnText: {
    fontSize: fp(15),
    fontWeight: '600',
    color: '#374151',
  },

  // Dark Mode Toggle Row
  darkModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(14),
    paddingHorizontal: wp(12),
    borderRadius: wp(12),
    marginBottom: hp(4),
  },
});
