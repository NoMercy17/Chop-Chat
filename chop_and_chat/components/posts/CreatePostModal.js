import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    TextInput, Image, Alert
} from 'react-native';
import { moderateText } from '../../utils/moderation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import BottomSheetModal from '../common/BottomSheetModal';
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

        const textFields = [
            { value: title,        label: 'title' },
            { value: description,  label: 'description' },
            { value: cookTime,     label: 'cook time' },
            { value: instructions, label: 'instructions' },
        ];
        for (const { value, label } of textFields) {
            if (value.trim() && moderateText(value).flagged) {
                Alert.alert(
                    'Content Not Allowed',
                    `Your post ${label} contains content that violates our community guidelines. Please revise it.`
                );
                return;
            }
        }
        const badIngredient = ingredients.find(i => i.trim() && moderateText(i).flagged);
        if (badIngredient) {
            Alert.alert('Content Not Allowed', 'One or more ingredients contain content that violates our community guidelines.');
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
    };

    const handleClose = () => { resetForm(); onClose(); };
    const handleBackPress = () => { resetForm(); onBack?.(); };

    const rightComponent = (
        <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
                styles.submitButton,
                { backgroundColor: isValid ? theme.primaryDark : theme.border },
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
            ]}
            disabled={!isValid}
        >
            <Text style={[styles.submitButtonText, { color: isValid ? theme.textInverse : theme.textTertiary }]}>
                {submitLabel}
            </Text>
        </Pressable>
    );

    return (
        <BottomSheetModal
            visible={visible}
            onClose={handleClose}
            title="Your Dish"
            subtitle={destination === 'chef' ? 'Step 1 of 2' : undefined}
            leftIcon={onBack ? 'arrow-back' : 'close'}
            onLeftPress={onBack ? handleBackPress : handleClose}
            rightComponent={rightComponent}
            keyboardAvoidMaxHeight="92%"
        >
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
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
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

