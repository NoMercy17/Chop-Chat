import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Switch, Alert, TouchableWithoutFeedback, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function SettingsModal({ visible, onClose, theme, isDarkMode, toggleTheme, onSignOut }) {
  const { token } = useContext(AuthContext);
  const [activeSettingTab, setActiveSettingTab] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const resetPasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords don't match");
      return;
    }
    if (newPassword === currentPassword) {
      Alert.alert("Error", "New password must be different from current");
      return;
    }
    try {
      setIsChangingPassword(true);
      await api.patch('/users/password', { currentPassword, newPassword }, token);
      resetPasswordFields();
      setActiveSettingTab(null);
      Alert.alert("Success", "Password changed successfully");
    } catch (error) {
      const message = error.status === 401
        ? "Current password is incorrect"
        : (error.data?.error || "Failed to change password");
      Alert.alert("Error", message);
    } finally {
      setIsChangingPassword(false);
    }
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

  const renderContent = () => {
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
            secureTextEntry
            placeholder="Confirm New Password"
            placeholderTextColor={theme.textTertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <View style={styles.settingTabButtons}>
            <Pressable
              style={[styles.cancelBtn, { backgroundColor: theme.borderLight }]}
              onPress={() => { resetPasswordFields(); setActiveSettingTab(null); }}
              disabled={isChangingPassword}
            >
              <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: isChangingPassword ? 0.7 : 1 }]}
              onPress={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={[styles.saveBtnText, { color: theme.textInverse }]}>Update</Text>}
            </Pressable>
          </View>
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
          <Pressable style={styles.settingsOption} onPress={() => setActiveSettingTab('password')}>
            <View style={styles.settingsOptionLeft}>
              <View style={[styles.settingsIconContainer, { backgroundColor: theme.warningLight }]}>
                <Ionicons name="lock-closed-outline" size={fp(20)} color={theme.warning} />
              </View>
              <Text style={[styles.settingsOptionTitle, { color: theme.textPrimary }]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={fp(20)} color={theme.textTertiary} />
          </Pressable>

          <View style={styles.darkModeRow}>
            <View style={styles.settingsOptionLeft}>
              <View style={[styles.settingsIconContainer, { backgroundColor: theme.primaryLighter }]}>
                <Ionicons name={isDarkMode ? "moon" : "moon-outline"} size={fp(20)} color={theme.primary} />
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
  passwordInput: { borderRadius: wp(8), padding: wp(12), borderWidth: 1, marginBottom: hp(12) },
  settingTabButtons: { flexDirection: 'row', gap: wp(12), marginTop: hp(16) },
  cancelBtn: { flex: 1, padding: hp(12), alignItems: 'center', borderRadius: wp(8) },
  cancelBtnText: { fontWeight: '600' },
  saveBtn: { flex: 1, padding: hp(12), alignItems: 'center', borderRadius: wp(8) },
  saveBtnText: { fontWeight: '600' },
});
