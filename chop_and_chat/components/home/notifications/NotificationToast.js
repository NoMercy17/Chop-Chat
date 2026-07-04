import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, NOTIFICATION_TYPES } from '../../../context/NotificationsContext';
import { useTheme } from '../../../context/ThemeContext';
import { wp, hp, fp } from '../../../utils/responsive';

const TYPE_META = {
  [NOTIFICATION_TYPES.NEW_FOLLOWER]:         { icon: 'person-add',   color: '#3B82F6' },
  [NOTIFICATION_TYPES.POST_LIKES]:           { icon: 'heart',         color: '#EF4444' },
  [NOTIFICATION_TYPES.COMMENT_ON_POST]:      { icon: 'chatbubble',    color: '#8B5CF6' },
  [NOTIFICATION_TYPES.CHEF_REVIEW_REQUEST]:  { icon: 'restaurant',    color: '#10B981' },
  [NOTIFICATION_TYPES.CHEF_REVIEW_RECEIVED]: { icon: 'star',          color: '#F59E0B' },
};

const TOAST_DURATION = 4000;
const OFFSCREEN = -100;

export default function NotificationToast() {
  const { toastQueue, dismissToast, openNotificationPanel } = useNotifications();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(OFFSCREEN)).current;
  const timerRef = useRef(null);
  const isAnimatingOut = useRef(false);

  const currentToast = toastQueue[0] || null;

  const slideOut = (toastId) => {
    if (isAnimatingOut.current) return;
    isAnimatingOut.current = true;
    clearTimeout(timerRef.current);
    Animated.timing(translateY, {
      toValue: OFFSCREEN,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      isAnimatingOut.current = false;
      dismissToast(toastId);
    });
  };

  useEffect(() => {
    if (!currentToast) {
      translateY.setValue(OFFSCREEN);
      return;
    }

    isAnimatingOut.current = false;

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 11,
    }).start();

    timerRef.current = setTimeout(() => slideOut(currentToast.id), TOAST_DURATION);

    return () => clearTimeout(timerRef.current);
  }, [currentToast?.id]);

  if (!currentToast) return null;

  const meta = TYPE_META[currentToast.type] || { icon: 'notifications', color: theme.primary };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toast,
          {
            top: insets.top + hp(8),
            backgroundColor: theme.cardBackground,
            shadowColor: theme.shadowColor,
            transform: [{ translateY }],
          },
        ]}
      >
        <Pressable
          style={styles.inner}
          onPress={() => {
            slideOut(currentToast.id);
            openNotificationPanel();
          }}
        >
          <View style={[styles.iconBox, { backgroundColor: meta.color + '22' }]}>
            <Ionicons name={meta.icon} size={fp(20)} color={meta.color} />
          </View>
          <View style={styles.textBox}>
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
              {currentToast.title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {currentToast.subtitle}
            </Text>
          </View>
          <Pressable
            onPress={() => slideOut(currentToast.id)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={fp(16)} color={theme.textTertiary} />
          </Pressable>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: wp(12),
    right: wp(12),
    borderRadius: wp(16),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(12),
    paddingHorizontal: wp(14),
    gap: wp(12),
  },
  iconBox: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBox: {
    flex: 1,
  },
  title: {
    fontSize: fp(14),
    fontWeight: '700',
    marginBottom: hp(2),
  },
  subtitle: {
    fontSize: fp(12),
    lineHeight: hp(16),
  },
});
