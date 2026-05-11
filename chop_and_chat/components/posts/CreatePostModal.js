import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Modal, ScrollView, Pressable,
    TextInput, Image, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import DifficultySelector from './create-post/DifficultySelector';
import UtensilSelector from './create-post/UtensilSelector';
import IngredientList from './create-post/IngredientList';

export default function CreatePostModal({ visible, onClose, onBack, imageUri, onSubmit, destination }) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [cookTime, setCookTime] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [selectedUtensils, setSelectedUtensils] = useState([]);
    const [ingredients, setIngredients] = useState(['']);
    const [instructions, setInstructions] = useState('');

    const hasValidIngredients = ingredients.some(i => i.trim().length > 0);
    // imageUri is always provided via the normal flow but guarded here as a safety net —
    // without it the backend rejects the post with a 400 on image_url.
    const isValid = !!imageUri && title.trim() && description.trim() && cookTime.trim() && hasValidIngredients;

    const submitLabel = destination === 'feed' ? 'Post' : 'Next';

    const toggleUtensil = useCallback((id) => {
        setSelectedUtensils(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
    }, []);

    const addIngredient = useCallback(() => setIngredients(prev => [...prev, '']), []);
    const updateIngredient = useCallback((index, value) => {
        setIngredients(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    }, []);
    const removeIngredient = useCallback((index) => {
        setIngredients(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
    }, []);

    const resetForm = useCallback(() => {
        setTitle('');
        setDescription('');
        setCookTime('');
        setDifficulty('Medium');
        setSelectedUtensils([]);
        setIngredients(['']);
        setInstructions('');
    }, []);

    const handleSubmit = () => {
        if (!isValid) {
            Alert.alert('Missing Fields', 'Please fill in all required fields marked with *');
            return;
        }
        onSubmit({
            title: title.trim(),
            description: description.trim(),
            cookTime: cookTime.trim(),
            difficulty,
            utensils: selectedUtensils,
            ingredients: ingredients.filter(i => i.trim()),
            instructions: instructions.trim(),
            imageUri,
        });
        // resetForm is intentionally NOT called here — MainActions resets state after confirmed success
    };

    const handleClose = () => { resetForm(); onClose(); };
    const handleBackPress = () => { resetForm(); onBack?.(); };

    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <Pressable style={styles.overlayPressable} onPress={handleClose} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                        <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: hp(16) + (Platform.OS === 'ios' ? 0 : 0) }]}>
                            <Pressable
                                onPress={onBack ? handleBackPress : handleClose}
                                style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}
                            >
                                <Ionicons name={onBack ? 'arrow-back' : 'close'} size={fp(24)} color={theme.textPrimary} />
                            </Pressable>
                            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Create Post</Text>
                            <Pressable
                                onPress={handleSubmit}
                                style={({ pressed }) => [
                                    styles.submitButton,
                                    { backgroundColor: isValid ? theme.primary : theme.border },
                                    pressed && { opacity: 0.7 },
                                ]}
                                disabled={!isValid}
                            >
                                <Text style={[styles.submitButtonText, { color: isValid ? theme.textInverse : theme.textTertiary }]}>
                                    {submitLabel}
                                </Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            style={styles.scrollContainer}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {imageUri && (
                                <View style={styles.imagePreviewContainer}>
                                    <Image source={{ uri: imageUri }} style={[styles.imagePreview, { backgroundColor: theme.imageBackground }]} />
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textPrimary }]}>
                                    Title <Text style={{ color: theme.danger }}>*</Text>
                                </Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
                                    placeholder="What did you make?"
                                    placeholderTextColor={theme.textTertiary}
                                    value={title}
                                    onChangeText={setTitle}
                                    maxLength={50}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textPrimary }]}>
                                    Description <Text style={{ color: theme.danger }}>*</Text>
                                </Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
                                    placeholder="Tell us about your dish..."
                                    placeholderTextColor={theme.textTertiary}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={3}
                                    maxLength={200}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textPrimary }]}>
                                    Cook Time <Text style={{ color: theme.danger }}>*</Text>
                                </Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
                                    placeholder="e.g. 30 min"
                                    placeholderTextColor={theme.textTertiary}
                                    value={cookTime}
                                    onChangeText={setCookTime}
                                    maxLength={20}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textPrimary }]}>Difficulty</Text>
                                <DifficultySelector selected={difficulty} onSelect={setDifficulty} theme={theme} />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textPrimary }]}>Kitchen Tools</Text>
                                <UtensilSelector selected={selectedUtensils} onToggle={toggleUtensil} theme={theme} />
                            </View>

                            <IngredientList
                                ingredients={ingredients}
                                onUpdate={updateIngredient}
                                onAdd={addIngredient}
                                onRemove={removeIngredient}
                                theme={theme}
                            />

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textPrimary }]}>Instructions</Text>
                                <TextInput
                                    style={[styles.input, styles.instructionsArea, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
                                    placeholder="Write your cooking instructions here..."
                                    placeholderTextColor={theme.textTertiary}
                                    value={instructions}
                                    onChangeText={setInstructions}
                                    multiline
                                    numberOfLines={6}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={{ height: hp(40) }} />
                        </ScrollView>
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
        flex: 1,
    },
    keyboardAvoid: {
        maxHeight: '92%',
    },
    modalContainer: {
        borderTopLeftRadius: wp(24),
        borderTopRightRadius: wp(24),
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(20),
        paddingBottom: hp(14),
        borderBottomWidth: 1,
    },
    headerButton: {
        width: wp(44),
        height: wp(44),
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fp(18),
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    submitButton: {
        paddingVertical: hp(8),
        paddingHorizontal: wp(16),
        borderRadius: wp(20),
        minHeight: hp(36),
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        fontWeight: '600',
        fontSize: fp(14),
    },
    scrollContainer: { flex: 1 },
    scrollContent: { padding: wp(20) },
    imagePreviewContainer: {
        marginBottom: hp(20),
        borderRadius: wp(16),
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: hp(200),
    },
    inputGroup: { marginBottom: hp(20) },
    label: { fontSize: fp(14), fontWeight: '600', marginBottom: hp(8) },
    input: {
        borderRadius: wp(12),
        paddingHorizontal: wp(16),
        paddingVertical: hp(12),
        fontSize: fp(15),
    },
    textArea: { minHeight: hp(80), textAlignVertical: 'top' },
    instructionsArea: { minHeight: hp(140), textAlignVertical: 'top', paddingTop: hp(12) },
});
