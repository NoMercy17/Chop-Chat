import React, { useContext, useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Modal, TextInput, Switch, Alert, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ActivityIndicator, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFollow } from "../context/FollowContext";
import { wp, hp, fp, SPACING } from "../utils/responsive";
import CameraScreen, { uploadImage } from "../utils/photoHandling";
import { uploadToCloudinary } from "../utils/cloudinaryUploads";
import { env } from "../utils/env";
import { mockFollowersList, mockFollowingList, mockMyRecipes } from "../data/mockData";

export default function ProfileScreen({ navigation }) {
  const auth = useContext(AuthContext);
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { myFollowingCount } = useFollow();
  const insets = useSafeAreaInsets();
  
  // Settings Modal State
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [activeSettingTab, setActiveSettingTab] = useState(null);
  
  // Profile Image Modal State
  const [imageSourceModalVisible, setImageSourceModalVisible] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // User name for display and initials
  const [userName, setUserName] = useState("User");
  
  // Followers/Following Modal State
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followModalType, setFollowModalType] = useState(null); // 'followers' or 'following'
  
  // Bio editing
  const [bio, setBio] = useState("Cool Chef");
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

  // Mock data for followers/following
  const [followersList, setFollowersList] = useState(mockFollowersList);

  const [followingList, setFollowingList] = useState(mockFollowingList);

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
      console.log('🔗 API URL:', env.API_URL);
      console.log('🔑 Token (first 20 chars):', token.substring(0, 20) + '...');
      
      const response = await fetch(`${env.API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 Response status:', response.status);

      if (response.status === 401 || response.status === 403) {
        console.error('🔒 Authentication failed, status:', response.status);
        console.log('⚠️ User needs to login again');
        Alert.alert(
          'Session Expired',
          'Please log in again to continue.',
          [{ text: 'OK', onPress: () => auth.signOut() }]
        );
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile loaded:', data.user);
        
        // Set user name
        if (data.user.name) {
          setUserName(data.user.name);
        }
        
        if (data.user.profile_photo) {
          console.log('🖼️ Profile photo URL:', data.user.profile_photo);
          setProfileImage(data.user.profile_photo);
        } else {
          console.log('📷 No profile photo');
          setProfileImage(null);
        }
        
        if (data.user.bio) {
          setBio(data.user.bio);
        }
      } else {
        console.error('❌ Failed to load profile, status:', response.status);
        const errorData = await response.text();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('❌ Failed to load profile:', error);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', 'Failed to load profile. Please check your connection.');
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
    console.log('📸 Profile photo captured:', uri);
    setProfileImage(uri); // Show local image immediately
    setCameraModalVisible(false);
    
    // Upload to Cloudinary and save to backend
    await uploadProfilePhoto(uri);
  };

  const handleAccessGallery = async () => {
    const uri = await uploadImage('gallery');
    setImageSourceModalVisible(false);
    
    if (uri) {
      console.log('🖼️ Gallery image selected:', uri);
      setProfileImage(uri); // Show local image immediately
      await uploadProfilePhoto(uri);
    }
  };

  const uploadProfilePhoto = async (localUri) => {
    try {
      setIsUploading(true);
      
      // Step 1: Upload to Cloudinary
      console.log('☁️ Uploading to CLOUDINARY...');
      const cloudinaryUrl = await uploadToCloudinary(localUri, 'profile_photos');
      
      if (!cloudinaryUrl) {
        Alert.alert('Error', 'Failed to upload photo to cloud storage');
        setIsUploading(false);
        // Revert to previous image
        await loadUserProfile();
        return;
      }
      
      console.log('✅ Cloudinary upload successful:', cloudinaryUrl);
      
      // Step 2: Save URL to backend
      console.log('💾 Saving to database...');
      let token = await AsyncStorage.getItem('userToken');
      if (!token) {
        const session = await AsyncStorage.getItem('session_user');
        if (session) token = JSON.parse(session).token;
      }
      
      console.log('🔗 Backend URL:', `${env.API_URL}/users/profile-photo`);
      
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
      
      console.log('📊 Backend response status:', response.status);
      const data = await response.json();
      console.log('📦 Backend response data:', data);
      
      if (response.ok) {
        console.log('✅ Profile photo saved to database!');
        setProfileImage(cloudinaryUrl); // Update to use Cloudinary URL
        Alert.alert('Success', 'Profile photo updated!');
        
        // Step 3: Reload profile to ensure data persists
        await loadUserProfile();
      } else {
        Alert.alert('Error', data.error || 'Failed to save photo to profile');
        // Revert to previous image
        await loadUserProfile();
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', 'Something went wrong while uploading the photo');
      // Revert to previous image
      await loadUserProfile();
    } finally {
      setIsUploading(false);
    }
  };

  // Followers/Following Modal Handlers
  const openFollowersModal = () => {
    setFollowModalType('followers');
    setFollowersModalVisible(true);
  };

  const openFollowingModal = () => {
    setFollowModalType('following');
    setFollowersModalVisible(true);
  };

  const closeFollowersModal = () => {
    setFollowersModalVisible(false);
    setTimeout(() => setFollowModalType(null), 300);
  };

  const renderFollowItem = ({ item }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.followItem,
        { backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : theme.inputBackground },
        pressed && [styles.followItemPressed, { backgroundColor: isDarkMode ? 'rgba(75, 85, 99, 0.6)' : '#F3F4F6' }]
      ]}
      onPress={() => {
        closeFollowersModal();
        setTimeout(() => {
          navigation.navigate('OtherUserProfile', {
            userId: item.id,
            userName: item.name,
            userAvatar: item.avatar || null,
            username: item.username
          });
        }, 300);
      }}
    >
      {item.avatar ? (
        <Image 
          source={{ uri: item.avatar }}
          style={[styles.followAvatar, { borderColor: isDarkMode ? '#4B5563' : theme.border }]}
        />
      ) : (
        <View style={[styles.followAvatar, styles.followAvatarPlaceholder, { borderColor: isDarkMode ? '#4B5563' : theme.border, backgroundColor: theme.primary }]}>
          <Text style={styles.followAvatarInitials}>{getInitials(item.name)}</Text>
        </View>
      )}
      <View style={styles.followInfo}>
        <Text style={[styles.followName, { color: theme.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.followUsername, { color: theme.textSecondary }]}>{item.username}</Text>
      </View>
      <Ionicons name="chevron-forward" size={fp(20)} color={theme.textTertiary} />
    </Pressable>
  );

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
              maxLength={30}
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
          {profileImage ? (
            <Image 
              source={{ uri: profileImage }}
              style={[styles.profileImage, { borderColor: theme.profileImageBorder }]}
            />
          ) : (
            <View style={[styles.profileImage, styles.avatarPlaceholder, { borderColor: theme.profileImageBorder, backgroundColor: theme.primary }]}>
              <Text style={styles.avatarInitials}>{getInitials(userName)}</Text>
            </View>
          )}
          <Pressable 
            style={[styles.editImageBadge, isDarkMode ? { backgroundColor: '#2563EB' } : { backgroundColor: theme.primary }]}
            onPress={handleChangeProfileImage}
            disabled={isUploading}
          >
            <Ionicons name="add" size={fp(18)} color={theme.textInverse} />
          </Pressable>
        </View>
        <Text style={[styles.username, { color: theme.profileTextPrimary }]}>{userName}</Text>
        <Text style={[styles.bio, { color: theme.profileTextSecondary }]} numberOfLines={1} ellipsizeMode="tail">
          {bio}
        </Text>
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Pressable 
          style={({ pressed }) => [
            styles.statItem,
            pressed && styles.statPressed
          ]}
          onPress={() => navigation.navigate("MyRecipes")}
        >
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{mockMyRecipes.length}</Text>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>Recipes</Text>
        </Pressable>

        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

        <Pressable 
          style={({ pressed }) => [
            styles.statItem,
            pressed && styles.statPressed
          ]}
          onPress={openFollowersModal}
        >
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{followersList.length}</Text>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>Followers</Text>
        </Pressable>

        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

        <Pressable 
          style={({ pressed }) => [
            styles.statItem,
            pressed && styles.statPressed
          ]}
          onPress={openFollowingModal}
        >
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{myFollowingCount}</Text>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>Following</Text>
        </Pressable>
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

      {/* Followers/Following Modal */}
      <Modal
        visible={followersModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeFollowersModal}
      >
        <TouchableWithoutFeedback onPress={closeFollowersModal}>
          <View style={[styles.modalOverlay, { backgroundColor: theme.overlayBackground }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                <View style={[styles.settingsMenu, { backgroundColor: theme.modalBackground }]}>
                  <View style={[styles.settingsHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.settingsTitle, { color: theme.textPrimary }]}>
                      {followModalType === 'followers' ? 'Followers' : 'Following'}
                    </Text>
                    <Text style={[styles.settingsSubtitle, { color: theme.textSecondary }]}>
                      {followModalType === 'followers' 
                        ? `${followersList.length} people follow you`
                        : `You follow ${myFollowingCount} people`
                      }
                    </Text>
                  </View>

                  <FlatList
                    data={followModalType === 'followers' ? followersList : followingList}
                    renderItem={renderFollowItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.followList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                      <View style={styles.emptyFollowList}>
                        <Ionicons 
                          name={followModalType === 'followers' ? "people-outline" : "person-add-outline"} 
                          size={fp(48)} 
                          color={theme.textTertiary} 
                        />
                        <Text style={[styles.emptyFollowText, { color: theme.textSecondary }]}>
                          {followModalType === 'followers' 
                            ? 'No followers yet'
                            : 'Not following anyone yet'
                          }
                        </Text>
                      </View>
                    }
                  />
                </View>

                <Pressable 
                  style={({ pressed }) => [styles.closeModalBtn, { backgroundColor: theme.border }, pressed && styles.btnPressed]}
                  onPress={closeFollowersModal}
                >
                  <Text style={[styles.closeModalBtnText, { color: theme.textPrimary }]}>Close</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: fp(32),
    fontWeight: '700',
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
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: wp(18),
    paddingVertical: hp(10),
    paddingHorizontal: wp(12),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: hp(18),
    marginHorizontal: SPACING.screenPadding,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  statValue: {
    fontSize: fp(22),
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  statText: {
    fontSize: fp(12),
    fontWeight: "500",
    color: "#6B7280",
    marginTop: hp(2),
  },
  statDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "#E5E7EB",
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

  // Followers/Following Modal Styles
  followList: {
    paddingHorizontal: wp(16),
    paddingTop: hp(12),
    paddingBottom: hp(20),
  },
  followItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(12),
    borderRadius: wp(12),
    marginBottom: hp(8),
  },
  followItemPressed: {
    backgroundColor: '#F3F4F6',
  },
  followAvatar: {
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  followAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  followAvatarInitials: {
    color: '#FFFFFF',
    fontSize: fp(18),
    fontWeight: '700',
  },
  followInfo: {
    flex: 1,
    marginLeft: wp(12),
  },
  followName: {
    fontSize: fp(16),
    fontWeight: '600',
    color: '#111827',
  },
  followUsername: {
    fontSize: fp(14),
    color: '#6B7280',
    marginTop: hp(2),
  },
  emptyFollowList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(60),
  },
  emptyFollowText: {
    fontSize: fp(16),
    color: '#9CA3AF',
    marginTop: hp(12),
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