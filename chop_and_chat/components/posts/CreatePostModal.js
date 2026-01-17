import { useState } from 'react';
import { 
    View, Text, StyleSheet, Modal, ScrollView, Pressable, 
    TextInput, Image, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];
const UTENSIL_OPTIONS = [
    { id: 'oven', label: 'Oven', icon: 'flame-outline' },
    { id: 'stove', label: 'Stove', icon: 'restaurant-outline' },
    { id: 'grill', label: 'Grill', icon: 'bonfire-outline' },
    { id: 'microwave', label: 'Microwave', icon: 'flash-outline' },
    { id: 'blender', label: 'Blender', icon: 'flask-outline' },
    { id: 'mixer', label: 'Mixer', icon: 'nutrition-outline' },
    { id: 'airfryer', label: 'Air Fryer', icon: 'leaf-outline' },
];

export default function CreatePostModal({ visible, onClose, imageUri, onSubmit }) {
    const { theme } = useTheme();
    
    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [cookTime, setCookTime] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [selectedUtensils, setSelectedUtensils] = useState([]);
    const [ingredients, setIngredients] = useState(['']);
    const [instructions, setInstructions] = useState('');
    
    // Validation - check all required fields
    const hasValidIngredients = ingredients.some(i => i.trim().length > 0);
    const isValid = title.trim() && description.trim() && cookTime.trim() && hasValidIngredients;

    // Get missing fields for error message
    const getMissingFields = () => {
        const missing = [];
        if (!title.trim()) missing.push('Title');
        if (!description.trim()) missing.push('Description');
        if (!cookTime.trim()) missing.push('Cook Time');
        if (!hasValidIngredients) missing.push('At least one Ingredient');
        return missing;
    };

    const toggleUtensil = (id) => {
        if (selectedUtensils.includes(id)) {
            setSelectedUtensils(selectedUtensils.filter(u => u !== id));
        } else {
            setSelectedUtensils([...selectedUtensils, id]);
        }
    };

    const addIngredient = () => {
        setIngredients([...ingredients, '']);
    };

    const updateIngredient = (index, value) => {
        const updated = [...ingredients];
        updated[index] = value;
        setIngredients(updated);
    };

    const removeIngredient = (index) => {
        if (ingredients.length > 1) {
            setIngredients(ingredients.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = () => {
        if (!isValid) {
            const missing = getMissingFields();
            Alert.alert(
                'Missing Required Fields',
                `Please fill in the following:\n\n• ${missing.join('\n• ')}`,
                [{ text: 'OK' }]
            );
            return;
        }
        
        const postData = {
            title: title.trim(),
            description: description.trim(),
            cookTime: cookTime.trim(),
            difficulty,
            utensils: selectedUtensils,
            ingredients: ingredients.filter(i => i.trim()),
            instructions: instructions.trim(),
            imageUri,
        };
        onSubmit(postData);
        resetForm();
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setCookTime('');
        setDifficulty('Medium');
        setSelectedUtensils([]);
        setIngredients(['']);
        setInstructions('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const getDifficultyColor = (diff) => {
        switch (diff) {
            case 'Easy': return '#10B981';
            case 'Medium': return '#F59E0B';
            case 'Hard': return '#EF4444';
            default: return theme.textSecondary;
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={[styles.container, { backgroundColor: theme.screenBackground }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Pressable onPress={handleClose} style={styles.headerButton}>
                            <Ionicons name="close" size={fp(24)} color={theme.textPrimary} />
                        </Pressable>
                        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Create Post</Text>
                        <Pressable 
                            onPress={handleSubmit} 
                            style={[styles.postButton, !isValid && styles.postButtonDisabled]}
                        >
                            <Text style={[styles.postButtonText, !isValid && { color: theme.textTertiary }]}>
                                Post
                            </Text>
                        </Pressable>
                    </View>

                    <ScrollView 
                        style={styles.scrollContainer}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Image Preview */}
                        {imageUri && (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                            </View>
                        )}

                        {/* Title */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>
                                Title <Text style={styles.required}>*</Text>
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

                        {/* Description */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>
                                Description <Text style={styles.required}>*</Text>
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
                            />
                        </View>

                        {/* Cook Time & Difficulty Row */}
                        <View style={styles.rowGroup}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.textPrimary }]}>
                                    Cook Time <Text style={styles.required}>*</Text>
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
                        </View>

                        {/* Difficulty */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>Difficulty</Text>
                            <View style={styles.difficultyRow}>
                                {DIFFICULTY_OPTIONS.map((diff) => (
                                    <Pressable
                                        key={diff}
                                        onPress={() => setDifficulty(diff)}
                                        style={[
                                            styles.difficultyChip,
                                            { 
                                                backgroundColor: difficulty === diff 
                                                    ? getDifficultyColor(diff) + '20' 
                                                    : theme.inputBackground,
                                                borderColor: difficulty === diff 
                                                    ? getDifficultyColor(diff) 
                                                    : theme.border,
                                            }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.difficultyChipText,
                                            { color: difficulty === diff ? getDifficultyColor(diff) : theme.textSecondary }
                                        ]}>
                                            {diff}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Kitchen Tools */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>Kitchen Tools</Text>
                            <View style={styles.utensilsGrid}>
                                {UTENSIL_OPTIONS.map((utensil) => {
                                    const isSelected = selectedUtensils.includes(utensil.id);
                                    return (
                                        <Pressable
                                            key={utensil.id}
                                            onPress={() => toggleUtensil(utensil.id)}
                                            style={[
                                                styles.utensilChip,
                                                { 
                                                    backgroundColor: isSelected ? theme.primaryLightest : theme.inputBackground,
                                                    borderColor: isSelected ? theme.primary : theme.border,
                                                }
                                            ]}
                                        >
                                            <Ionicons 
                                                name={utensil.icon} 
                                                size={fp(16)} 
                                                color={isSelected ? theme.primary : theme.textSecondary} 
                                            />
                                            <Text style={[
                                                styles.utensilChipText,
                                                { color: isSelected ? theme.primary : theme.textSecondary }
                                            ]}>
                                                {utensil.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Ingredients */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: theme.textPrimary }]}>
                                    Ingredients <Text style={styles.required}>*</Text>
                                </Text>
                                <Pressable onPress={addIngredient} style={styles.addButton}>
                                    <Ionicons name="add-circle" size={fp(22)} color={theme.primary} />
                                </Pressable>
                            </View>
                            {ingredients.map((ingredient, index) => (
                                <View key={index} style={styles.ingredientRow}>
                                    <View style={[styles.bulletPoint, { backgroundColor: theme.primary }]} />
                                    <TextInput
                                        style={[styles.ingredientInput, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
                                        placeholder={`Ingredient ${index + 1}`}
                                        placeholderTextColor={theme.textTertiary}
                                        value={ingredient}
                                        onChangeText={(text) => updateIngredient(index, text)}
                                    />
                                    {ingredients.length > 1 && (
                                        <Pressable onPress={() => removeIngredient(index)} style={styles.removeButton}>
                                            <Ionicons name="close-circle" size={fp(20)} color={theme.danger} />
                                        </Pressable>
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* Instructions */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>Instructions</Text>
                            <TextInput
                                style={[styles.input, styles.instructionsArea, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
                                placeholder="Write your cooking instructions here...&#10;&#10;"
                                placeholderTextColor={theme.textTertiary}
                                value={instructions}
                                onChangeText={setInstructions}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Bottom Spacing */}
                        <View style={{ height: hp(40) }} />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.screenPadding,
        paddingVertical: hp(12),
        borderBottomWidth: 1,
    },
    headerButton: {
        padding: wp(4),
    },
    headerTitle: {
        fontSize: fp(18),
        fontWeight: '700',
    },
    postButton: {
        paddingVertical: hp(8),
        paddingHorizontal: wp(16),
        backgroundColor: '#3B82F6',
        borderRadius: wp(20),
    },
    postButtonDisabled: {
        backgroundColor: '#E5E7EB',
    },
    postButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: fp(14),
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.screenPadding,
    },
    imagePreviewContainer: {
        marginBottom: hp(20),
        borderRadius: wp(16),
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: hp(200),
        backgroundColor: '#F3F4F6',
    },
    inputGroup: {
        marginBottom: hp(20),
    },
    label: {
        fontSize: fp(14),
        fontWeight: '600',
        marginBottom: hp(8),
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(8),
    },
    required: {
        color: '#EF4444',
    },
    input: {
        borderRadius: wp(12),
        paddingHorizontal: wp(16),
        paddingVertical: hp(12),
        fontSize: fp(15),
    },
    textArea: {
        minHeight: hp(80),
        textAlignVertical: 'top',
    },
    rowGroup: {
        flexDirection: 'row',
        gap: wp(12),
    },
    difficultyRow: {
        flexDirection: 'row',
        gap: wp(10),
    },
    difficultyChip: {
        paddingVertical: hp(10),
        paddingHorizontal: wp(20),
        borderRadius: wp(20),
        borderWidth: 1,
    },
    difficultyChipText: {
        fontSize: fp(14),
        fontWeight: '600',
    },
    utensilsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(8),
    },
    utensilChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(6),
        paddingVertical: hp(8),
        paddingHorizontal: wp(12),
        borderRadius: wp(20),
        borderWidth: 1,
    },
    utensilChipText: {
        fontSize: fp(13),
        fontWeight: '500',
    },
    addButton: {
        padding: wp(4),
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(8),
    },
    bulletPoint: {
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
        marginRight: wp(10),
    },
    ingredientInput: {
        flex: 1,
        borderRadius: wp(10),
        paddingHorizontal: wp(14),
        paddingVertical: hp(10),
        fontSize: fp(14),
    },
    removeButton: {
        padding: wp(6),
        marginLeft: wp(6),
    },
    instructionsArea: {
        minHeight: hp(140),
        textAlignVertical: 'top',
        paddingTop: hp(12),
    },
});
