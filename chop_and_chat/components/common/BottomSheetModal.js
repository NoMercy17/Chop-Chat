import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

export default function BottomSheetModal({
    visible,
    onClose,
    title,
    leftIcon,
    onLeftPress,
    rightComponent,
    children,
    keyboardAvoidMaxHeight = '90%',
    transparent = true,
    animationType = 'slide',
}) {
    const { theme } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent={transparent}
            animationType={animationType}
            onRequestClose={onClose}
        >
            <View style={[styles.overlay, { backgroundColor: theme.overlayBackground }]}>
                {/* Background press to close */}
                <Pressable style={styles.overlayPressable} onPress={onClose} />
                
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.keyboardAvoid, { maxHeight: keyboardAvoidMaxHeight }]}
                >
                    <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                        {/* Header */}
                        {title !== undefined && (
                            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                                {/* Left Button */}
                                {leftIcon ? (
                                    <Pressable
                                        onPress={onLeftPress || onClose}
                                        style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}
                                    >
                                        <Ionicons name={leftIcon} size={fp(24)} color={theme.textPrimary} />
                                    </Pressable>
                                ) : (
                                    <View style={styles.headerButtonPlaceholder} />
                                )}

                                {/* Title */}
                                <Text style={[styles.title, { color: theme.textPrimary }]}>
                                    {title}
                                </Text>

                                {/* Right Component (or placeholder to balance title centering) */}
                                {rightComponent ? (
                                    rightComponent
                                ) : (
                                    <View style={styles.headerButtonPlaceholder} />
                                )}
                            </View>
                        )}

                        {/* Content area */}
                        {children}
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayPressable: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    keyboardAvoid: {
        width: '100%',
    },
    modalContainer: {
        borderTopLeftRadius: wp(24),
        borderTopRightRadius: wp(24),
        height: '100%',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(20),
        paddingVertical: hp(16),
        borderBottomWidth: 1,
    },
    title: {
        fontSize: fp(18),
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    headerButton: {
        padding: wp(4),
        width: wp(40),
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerButtonPlaceholder: {
        width: wp(40),
    },
});
