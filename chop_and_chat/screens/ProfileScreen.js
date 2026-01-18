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

      if (response.status === 401 || response.status === 403) {
        console.error(' Authentication failed, status:', response.status);
        console.log(' User needs to login again');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log(' Profile loaded:', data.user);
        
        if (data.user.profile_photo) {
          console.log(' Profile photo URL:', data.user.profile_photo);
          setProfileImage(data.user.profile_photo);
        } else {
          console.log(' No profile photo');
          setProfileImage(null);
        }
        
        if (data.user.bio) {
          setBio(data.user.bio);
        }
      } else {
        console.error(' Failed to load profile, status:', response.status);
      }
    } catch (error) {
      console.error(' Failed to load profile:', error);
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
      console.log(' Uploading to CLOUDINARY...');
      const cloudinaryUrl = await uploadToCloudinary(localUri, 'profile_photos');
      
      if (!cloudinaryUrl) {
        Alert.alert('Error', 'Failed to upload photo');
        setIsUploading(false);
        return;
      }
      
      // Step 2: Save URL to backend
      console.log(' Saving to database...');
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
        console.log(' Profile photo saved!');
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
            <Text style={[styles.settingTabTitle, { color: theme.textPrimary }]}>Update Bio</Text>
            <Text style={[styles.settingTabSubtitle, { color: theme.textSecondary }]}>Tell others about your cooking style</Text>
            <TextInput
              style={[styles.bioInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.textPrimary }]}
              value={tempBio}
              onChangeText={setTempBio}
              placeholder="Enter your bio..."
              placeholderTextColor={theme.placeholderText}
              multiline
              maxLength={50}
            />
            <Text style={[styles.charCount, { color: theme.textTertiary }]}>{tempBio.length}/50</Text>
            <View style={styles.settingTabButtons}>
              <Pressable 
                style={({ pressed }) => [styles.cancelBtn, { backgroundColor: theme.inputBackground }, pressed && styles.btnPressed]}
                onPress={() => setActiveSettingTab(null)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
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
            <Text style={[styles.settingTabTitle, { color: theme.textPrimary }]}>Change Password</Text>
            <Text style={[styles.settingTabSubtitle, { color: theme.textSecondary }]}>Enter your current and new password</Text>
            <TextInput
              style={[styles.passwordInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.textPrimary }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              placeholderTextColor={theme.placeholderText}
              secureTextEntry
            />
            <TextInput
              style={[styles.passwordInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.textPrimary }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor={theme.placeholderText}
              secureTextEntry
            />
            <TextInput
              style={[styles.passwordInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.textPrimary }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={theme.placeholderText}
              secureTextEntry
            />
            <View style={styles.settingTabButtons}>
              <Pressable 
                style={({ pressed }) => [styles.cancelBtn, { backgroundColor: theme.inputBackground }, pressed && styles.btnPressed]}
                onPress={() => {
                  setActiveSettingTab(null);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
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
            <Text style={[styles.settingTabTitle, { color: theme.textPrimary }]}>Notifications</Text>
            <Text style={[styles.settingTabSubtitle, { color: theme.textSecondary }]}>Choose what you want to be notified about</Text>
            
            <View style={styles.notificationsList}>
              <View style={[styles.notificationItem, { backgroundColor: theme.inputBackground }]}>
                <View style={styles.notificationInfo}>
                  <Ionicons name="star-outline" size={fp(20)} color={theme.primary} />
                  <Text style={[styles.notificationLabel, { color: theme.textPrimary }]}>Chef Reviews</Text>
                </View>
                <Switch
                  value={notifications.chefReviews}
                  onValueChange={() => toggleNotification('chefReviews')}
                  trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
                  thumbColor={notifications.chefReviews ? theme.switchThumbOn : theme.switchThumbOff}
                />
              </View>
              
              <View style={[styles.notificationItem, { backgroundColor: theme.inputBackground }]}>
                <View style={styles.notificationInfo}>
                  <Ionicons name="heart-outline" size={fp(20)} color={theme.primary} />
                  <Text style={[styles.notificationLabel, { color: theme.textPrimary }]}>Likes & Comments</Text>
                </View>
                <Switch
                  value={notifications.likesComments}
                  onValueChange={() => toggleNotification('likesComments')}
                  trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
                  thumbColor={notifications.likesComments ? theme.switchThumbOn : theme.switchThumbOff}
                />
              </View>
              
              <View style={[styles.notificationItem, { backgroundColor: theme.inputBackground }]}>
                <View style={styles.notificationInfo}>
                  <Ionicons name="people-outline" size={fp(20)} color={theme.primary} />
                  <Text style={[styles.notificationLabel, { color: theme.textPrimary }]}>New Followers</Text>
                </View>
                <Switch
                  value={notifications.newFollowers}
                  onValueChange={() => toggleNotification('newFollowers')}
                  trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
                  thumbColor={notifications.newFollowers ? theme.switchThumbOn : theme.switchThumbOff}
                />
              </View>
            </View>
            
            <Pressable 
              style={({ pressed }) => [styles.backToSettingsBtn, { backgroundColor: theme.inputBackground }, pressed && styles.btnPressed]}
              onPress={() => setActiveSettingTab(null)}
            >
              <Ionicons name="arrow-back" size={fp(18)} color={theme.textSecondary} />
              <Text style={[styles.backToSettingsBtnText, { color: theme.textPrimary }]}>Back to Settings</Text>
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
            !isDarkMode && styles.backButtonLight,
            pressed && styles.backButtonPressed
          ]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={fp(24)} color={theme.headerTitleColor} />
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
            style={[styles.editImageBadge, isDarkMode ? { backgroundColor: '#2563EB' } : { backgroundColor: theme.primary }]}
            onPress={handleChangeProfileImage}
            disabled={isUploading}
          >
            <Ionicons name="add" size={fp(18)} color={theme.textInverse} />
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

      {/* Profile Image Source Modal - Compact Top Design */}
      <Modal 
        visible={imageSourceModalVisible} 
        transparent={true} 
        animationType="slide"
        onRequestClose={() => setImageSourceModalVisible(false)}
      >
        <Pressable 
          style={[styles.compactModalOverlay, { backgroundColor: theme.overlayBackground }]}
          onPress={() => setImageSourceModalVisible(false)}
        >
          <View style={[styles.compactModalContainer, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.compactModalHandle} />
            
            <Text style={[styles.compactModalTitle, { color: theme.textPrimary }]}>
              Update Profile Picture
            </Text>
            
            <View style={styles.compactOptionsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.compactOption,
                  { backgroundColor: theme.inputBackground },
                  pressed && styles.compactOptionPressed
                ]}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera-outline" size={fp(24)} color={theme.success} />
                <Text style={[styles.compactOptionText, { color: theme.textPrimary }]}>
                  Take Photo
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.compactOption,
                  { backgroundColor: theme.inputBackground },
                  pressed && styles.compactOptionPressed
                ]}
                onPress={handleAccessGallery}
              >
                <Ionicons name="images-outline" size={fp(24)} color={theme.primary} />
                <Text style={[styles.compactOptionText, { color: theme.textPrimary }]}>
                  Choose from Gallery
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.modalHint, { color: theme.textTertiary }]}>
              You can change this anytime
            </Text>
          </View>
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
    bottom: -wp(2),
    right: -wp(2),
    width: wp(34),
    height: wp(34),
    borderRadius: wp(17),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  editImageBadgeDark: {
    borderColor: '#334155',
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

  // Compact Top Modal Styles
  compactModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    paddingTop: hp(60),
  },
  compactModalContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: wp(20),
    borderBottomRightRadius: wp(20),
    paddingTop: hp(12),
    paddingBottom: hp(24),
    paddingHorizontal: wp(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp(4) },
    shadowOpacity: 0.15,
    shadowRadius: wp(12),
    elevation: 8,
  },
  compactModalHandle: {
    width: wp(40),
    height: hp(4),
    backgroundColor: '#D1D5DB',
    borderRadius: wp(2),
    alignSelf: 'center',
    marginBottom: hp(16),
  },
  compactModalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: hp(16),
  },
  compactOptionsContainer: {
    backgroundColor: 'transparent',
    gap: hp(12),
  },
  compactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(16),
    paddingVertical: hp(18),
    paddingHorizontal: wp(20),
    borderRadius: wp(14),
  },
  compactOptionPressed: {
    backgroundColor: '#F3F4F6',
  },
  compactOptionText: {
    fontSize: fp(16),
    fontWeight: '600',
    color: '#111827',
  },
  modalHint: {
    textAlign: 'center',
    fontSize: fp(12),
    color: '#9CA3AF',
    marginTop: hp(12),
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
