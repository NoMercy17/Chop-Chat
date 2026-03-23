import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Switch, Alert, TouchableWithoutFeedback, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { api } from '../../services/api';

export default function SettingsModal({ visible, onClose, user, token, theme, isDarkMode, toggleTheme, onSignOut, onBioUpdate }) {
  const [activeSettingTab, setActiveSettingTab] = useState(null);
  const [tempBio, setTempBio] = useState(user?.bio || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notifications, setNotifications] = useState({
    recipeMatches: true,
    chefReviews: true,
    likesComments: true,
    newFollowers: false,
  });

  const handleSaveBio = async () => {
    try {
      const data = await api.patch('/users/bio', { bio: tempBio }, token);
      if (onBioUpdate) onBioUpdate(data.user.bio);
      setActiveSettingTab(null);
      Alert.alert("Success", "Bio updated successfully");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update bio");
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
    Alert.alert("Success", "Password changed successfully");
    setActiveSettingTab(null);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onSignOut() }
      ]
    );
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderContent = () => {
    if (activeSettingTab === 'bio') {
      return (
        <View style={styles.settingTabContent}>
          <Text style={[styles.settingTabTitle, { color: theme.textPrimary }]}>Update Bio</Text>
          <Text style={[styles.settingTabSubtitle, { color: theme.textSecondary }]}>Tell the community about yourself</Text>
          
          <TextInput
            style={[styles.bioInput, { color: theme.textPrimary, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
            multiline
            numberOfLines={4}
            value={tempBio}
            onChangeText={setTempBio}
            maxLength={150}
            placeholder="Write something about your culinary journey..."
            placeholderTextColor={theme.textTertiary}
          />
          <Text style={[styles.charCount, { color: theme.textTertiary }]}>{tempBio.length}/150</Text>
          
          <View style={styles.settingTabButtons}>
            <Pressable style={[styles.cancelBtn, { backgroundColor: theme.borderLight }]} onPress={() => setActiveSettingTab(null)}>
              <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSaveBio}>
              <Text style={[styles.saveBtnText, { color: '#FFFFFF' }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (activeSettingTab === 'password') {
      return (
        <View style={styles.settingTabContent}>
          <Text style={[styles.settingTabTitle, { color: theme.textPrimary }]}>Change Password</Text>
          <Text style={[styles.settingTabSubtitle, { color: theme.textSecondary }]}>Keep your account secure</Text>
          
          <TextInput
            style={[styles.passwordInput, { color: theme.textPrimary, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
            secureTextEntry
            placeholder="Current Password"
            placeholderTextColor={theme.textTertiary}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TextInput
            style={[styles.passwordInput, { color: theme.textPrimary, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
            secureTextEntry
            placeholder="New Password"
            placeholderTextColor={theme.textTertiary}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={[styles.passwordInput, { color: theme.textPrimary, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
            secureTypeEntry
            placeholder="Confirm New Password"
            placeholderTextColor={theme.textTertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          
          <View style={styles.settingTabButtons}>
            <Pressable style={[styles.cancelBtn, { backgroundColor: theme.borderLight }]} onPress={() => setActiveSettingTab(null)}>
              <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleChangePassword}>
              <Text style={[styles.saveBtnText, { color: '#FFFFFF' }]}>Update</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (activeSettingTab === 'notifications') {
      return (
        <View style={styles.settingTabContent}>
          <Text style={[styles.settingTabTitle, { color: theme.textPrimary }]}>Notifications</Text>
          <Text style={[styles.settingTabSubtitle, { color: theme.textSecondary }]}>Choose what you want to be alerted about</Text>
          
          <View style={styles.notificationsList}>
            {['recipeMatches', 'chefReviews', 'likesComments'].map((key) => (
              <View key={key} style={[styles.notificationItem, { backgroundColor: theme.inputBackground }]}>
                <View style={styles.notificationInfo}>
                  <Ionicons 
                    name={key === 'recipeMatches' ? "restaurant-outline" : key === 'chefReviews' ? "star-outline" : "heart-outline"} 
                    size={fp(20)} 
                    color={theme.primary} 
                  />
                  <Text style={[styles.notificationLabel, { color: theme.textPrimary }]}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Text>
                </View>
                <Switch
                  value={notifications[key]}
                  onValueChange={() => toggleNotification(key)}
                  trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
                  thumbColor={notifications[key] ? theme.switchThumbOn : theme.switchThumbOff}
                />
              </View>
            ))}
          </View>
          
          <Pressable 
            style={styles.backToSettingsBtn}
            onPress={() => setActiveSettingTab(null)}
          >
            <Ionicons name="arrow-back" size={fp(18)} color={theme.textSecondary} />
            <Text style={[styles.backToSettingsBtnText, { color: theme.textPrimary }]}>Back to Settings</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={[styles.settingsMenu, { backgroundColor: theme.modalBackground }]}>
        <View style={[styles.settingsHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.settingsTitle, { color: theme.textPrimary }]}>Settings</Text>
          <Text style={[styles.settingsSubtitle, { color: theme.textSecondary }]}>Manage your preferences</Text>
        </View>

        <View style={styles.settingsOptions}>
          <Pressable style={styles.settingsOption} onPress={() => { setTempBio(user?.bio || ""); setActiveSettingTab('bio'); }}>
            <View style={styles.settingsOptionLeft}>
              <View style={[styles.settingsIconContainer, { backgroundColor: isDarkMode ? theme.primaryLighter : theme.primaryLightest }]}>
                <Ionicons name="pencil-outline" size={fp(20)} color={theme.primary} />
              </View>
              <Text style={[styles.settingsOptionTitle, { color: theme.textPrimary }]}>Update Bio</Text>
            </View>
            <Ionicons name="chevron-forward" size={fp(20)} color={theme.textTertiary} />
          </Pressable>

          <Pressable style={styles.settingsOption} onPress={() => setActiveSettingTab('password')}>
            <View style={styles.settingsOptionLeft}>
              <View style={[styles.settingsIconContainer, { backgroundColor: isDarkMode ? theme.warningLight : '#FEF3C7' }]}>
                <Ionicons name="lock-closed-outline" size={fp(20)} color={theme.warning} />
              </View>
              <Text style={[styles.settingsOptionTitle, { color: theme.textPrimary }]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={fp(20)} color={theme.textTertiary} />
          </Pressable>

          <View style={styles.darkModeRow}>
            <View style={styles.settingsOptionLeft}>
              <View style={[styles.settingsIconContainer, { backgroundColor: isDarkMode ? '#312E81' : '#EDE9FE' }]}>
                <Ionicons name={isDarkMode ? "moon" : "moon-outline"} size={fp(20)} color={isDarkMode ? '#A78BFA' : '#7C3AED'} />
              </View>
              <Text style={[styles.settingsOptionTitle, { color: theme.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch 
                value={isDarkMode} 
                onValueChange={toggleTheme}
                trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
                thumbColor={isDarkMode ? theme.switchThumbOn : theme.switchThumbOff}
            />
          </View>

          <Pressable style={styles.settingsOption} onPress={handleDeleteAccount}>
            <View style={styles.settingsOptionLeft}>
              <View style={[styles.settingsIconContainer, { backgroundColor: theme.dangerLighter }]}>
                <Ionicons name="trash-outline" size={fp(20)} color={theme.danger} />
              </View>
              <Text style={[styles.settingsOptionTitle, { color: theme.danger }]}>Delete Account</Text>
            </View>
          </Pressable>
        </View>
        <Pressable style={[styles.closeModalBtn, { backgroundColor: theme.borderLight }]} onPress={onClose}>
          <Text style={[styles.closeModalBtnText, { color: theme.textPrimary }]}>Close</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                {renderContent()}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: wp(24), borderTopRightRadius: wp(24), paddingBottom: hp(30) },
  settingsMenu: { padding: wp(20) },
  settingsHeader: { marginBottom: hp(20), borderBottomWidth: 1, paddingBottom: hp(10) },
  settingsTitle: { fontSize: fp(22), fontWeight: '700' },
  settingsSubtitle: { fontSize: fp(14) },
  settingsOptions: { gap: hp(10) },
  settingsOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: hp(12) },
  settingsOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(12) },
  settingsIconContainer: { width: wp(40), height: wp(40), borderRadius: wp(8), justifyContent: 'center', alignItems: 'center' },
  settingsOptionTitle: { fontSize: fp(16), fontWeight: '600' },
  darkModeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: hp(12) },
  closeModalBtn: { marginTop: hp(20), paddingVertical: hp(12), alignItems: 'center', borderRadius: wp(8) },
  closeModalBtnText: { fontWeight: '600' },
  settingTabContent: { padding: wp(24) },
  settingTabTitle: { fontSize: fp(20), fontWeight: '700' },
  settingTabSubtitle: { fontSize: fp(14), marginBottom: hp(16) },
  bioInput: { borderRadius: wp(8), padding: wp(12), minHeight: hp(100), textAlignVertical: 'top', borderWidth: 1 },
  charCount: { textAlign: 'right', fontSize: fp(12), marginTop: hp(4) },
  passwordInput: { borderRadius: wp(8), padding: wp(12), borderWidth: 1, marginBottom: hp(12) },
  settingTabButtons: { flexDirection: 'row', gap: wp(12), marginTop: hp(16) },
  cancelBtn: { flex: 1, padding: hp(12), alignItems: 'center', borderRadius: wp(8) },
  cancelBtnText: { fontWeight: '600' },
  saveBtn: { flex: 1, padding: hp(12), alignItems: 'center', borderRadius: wp(8) },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600' },
  notificationsList: { gap: hp(10) },
  notificationItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: wp(12), borderRadius: wp(8) },
  notificationInfo: { flexDirection: 'row', alignItems: 'center', gap: wp(12) },
  notificationLabel: { fontSize: fp(15) },
  backToSettingsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(8), marginTop: hp(20), padding: hp(10), borderRadius: wp(8) },
  backToSettingsBtnText: { fontWeight: '600' },
});
