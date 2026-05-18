import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Switch, Alert, TouchableWithoutFeedback, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const NOTIF_LABELS = {
  new_follower:    { label: 'New Followers',   icon: 'person-add-outline' },
  post_likes:      { label: 'Post Likes',       icon: 'heart-outline' },
  comment_on_post: { label: 'Post Comments',    icon: 'chatbubble-outline' },
};
const THRESHOLD_OPTIONS = [
  { value: 1,  label: 'Every 1' },
  { value: 5,  label: 'Every 5' },
  { value: 10, label: 'Every 10' },
  { value: 25, label: 'Every 25' },
  { value: 0,  label: 'Off' },
];


export default function SettingsModal({ visible, onClose, theme, isDarkMode, toggleTheme, onSignOut }) {
  const { token } = useContext(AuthContext);
  const [activeSettingTab, setActiveSettingTab] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    new_follower:    { enabled: true, threshold: 1 },
    post_likes:      { enabled: true, threshold: 1 },
    comment_on_post: { enabled: true, threshold: 1 },
  });
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingPref, setSavingPref] = useState(null);

  const loadPreferences = useCallback(async () => {
    if (!token) return;
    setLoadingPrefs(true);
    try {
      const data = await api.get('/notifications/preferences', token);
      setNotifPrefs(data.preferences);
    } catch (err) {
      console.warn('[SettingsModal:loadPreferences] Failed to load preferences:', err?.message);
    } finally {
      setLoadingPrefs(false);
    }
  }, [token]);

  // Load preferences whenever the modal opens so the toggles are fresh on every visit
  useEffect(() => {
    if (visible) loadPreferences();
  }, [visible, loadPreferences]);

  const updatePref = async (type, changes) => {
    const previous = notifPrefs[type];
    const updated = { ...previous, ...changes };
    setNotifPrefs(prev => ({ ...prev, [type]: updated }));
    setSavingPref(type);
    try {
      await api.patch('/notifications/preferences', { type, ...updated }, token);
    } catch (err) {
      console.warn('[SettingsModal:updatePref] Failed to save preference:', err?.message);
      setNotifPrefs(prev => ({ ...prev, [type]: previous }));
    } finally {
      setSavingPref(null);
    }
  };

  const handleThresholdPress = (type, optValue) => {
    if (optValue === 0) {
      updatePref(type, { enabled: false });
    } else {
      updatePref(type, { enabled: true, threshold: optValue });
    }
  };
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
    if (activeSettingTab === 'notifications') {
      return (
        <View style={styles.settingTabContent}>
          <Pressable style={({ pressed }) => [styles.backRow, pressed && { opacity: 0.7 }]} onPress={() => setActiveSettingTab(null)}>
            <Ionicons name="chevron-back" size={fp(18)} color={theme.primary} />
            <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
          </Pressable>
          <Text style={[styles.settingTabTitle, { color: theme.textPrimary }]}>Notifications</Text>

          {loadingPrefs ? (
            <ActivityIndicator color={theme.primary} style={{ marginTop: hp(24) }} />
          ) : (
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground, marginTop: hp(16) }]}>
              {Object.entries(NOTIF_LABELS).map(([type, meta], idx, arr) => {
                const pref = notifPrefs[type] || { enabled: true, threshold: 1 };
                const activeVal = pref.enabled ? pref.threshold : 0;
                return (
                  <View
                    key={type}
                    style={[
                      styles.activityRow,
                      idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
                    ]}
                  >
                    <View style={styles.activityRowTop}>
                      <View style={[styles.notifIconBox, { backgroundColor: theme.primaryLighter }]}>
                        <Ionicons name={meta.icon} size={fp(16)} color={theme.primary} />
                      </View>
                      <Text style={[styles.notifLabel, { color: theme.textPrimary }]}>{meta.label}</Text>
                      {savingPref === type && (
                        <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 'auto' }} />
                      )}
                    </View>
                    <View style={styles.thresholdChips}>
                      {THRESHOLD_OPTIONS.map(opt => {
                        const isActive = activeVal === opt.value;
                        const isOff = opt.value === 0;
                        return (
                          <Pressable
                            key={opt.value}
                            style={({ pressed }) => [
                              styles.chip,
                              {
                                backgroundColor: isActive
                                  ? (isOff ? theme.borderDark : theme.primary)
                                  : theme.borderLight,
                              },
                              pressed && { opacity: 0.75, transform: [{ scale: 0.94 }] },
                            ]}
                            onPress={() => handleThresholdPress(type, opt.value)}
                            disabled={savingPref === type}
                          >
                            <Text style={[
                              styles.chipText,
                              { color: isActive ? '#fff' : (isOff ? theme.textTertiary : theme.textSecondary) }
                            ]}>
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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
        </View>

        <View style={styles.settingsOptions}>
          <Pressable style={({ pressed }) => [styles.settingsOption, pressed && { opacity: 0.7 }]} onPress={() => setActiveSettingTab('notifications')}>
            <View style={styles.settingsOptionLeft}>
              <View style={[styles.settingsIconContainer, { backgroundColor: theme.primaryLighter }]}>
                <Ionicons name="notifications-outline" size={fp(20)} color={theme.primary} />
              </View>
              <Text style={[styles.settingsOptionTitle, { color: theme.textPrimary }]}>Notification Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={fp(20)} color={theme.textTertiary} />
          </Pressable>

          <Pressable style={({ pressed }) => [styles.settingsOption, pressed && { opacity: 0.7 }]} onPress={() => setActiveSettingTab('password')}>
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

          <Pressable style={({ pressed }) => [styles.settingsOption, pressed && { opacity: 0.7 }]} onPress={handleDeleteAccount}>
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
  modalContainer: { borderTopLeftRadius: wp(24), borderTopRightRadius: wp(24), paddingBottom: hp(30), maxHeight: '88%' },
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
  closeModalBtn: { marginTop: hp(20), paddingVertical: hp(12), alignItems: 'center', borderRadius: wp(12) },
  closeModalBtnText: { fontWeight: '600' },
  settingTabContent: { padding: wp(24) },
  settingTabTitle: { fontSize: fp(20), fontWeight: '700' },
  settingTabSubtitle: { fontSize: fp(14), marginBottom: hp(16) },
  passwordInput: { borderRadius: wp(12), padding: wp(12), borderWidth: 1, marginBottom: hp(12) },
  settingTabButtons: { flexDirection: 'row', gap: wp(12), marginTop: hp(16) },
  cancelBtn: { flex: 1, padding: hp(12), alignItems: 'center', borderRadius: wp(12) },
  cancelBtnText: { fontWeight: '600' },
  saveBtn: { flex: 1, padding: hp(12), alignItems: 'center', borderRadius: wp(12) },
  saveBtnText: { fontWeight: '600' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: wp(4), marginBottom: hp(12) },
  backText: { fontSize: fp(15), fontWeight: '600' },
  sectionCard: { borderRadius: wp(14), overflow: 'hidden' },
  activityRow: { paddingVertical: hp(12), paddingHorizontal: wp(14) },
  activityRowTop: { flexDirection: 'row', alignItems: 'center', gap: wp(12), marginBottom: hp(10) },
  notifIconBox: { width: wp(34), height: wp(34), borderRadius: wp(8), justifyContent: 'center', alignItems: 'center' },
  notifLabel: { fontSize: fp(14), fontWeight: '600' },
  thresholdChips: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(6) },
  chip: { paddingHorizontal: wp(11), paddingVertical: hp(5), borderRadius: wp(20) },
  chipText: { fontSize: fp(12), fontWeight: '600' },
});
