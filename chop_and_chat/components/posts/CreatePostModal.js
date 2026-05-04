import { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, Modal, ScrollView, Pressable, 
    TextInput, Image, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import DifficultySelector from './create-post/DifficultySelector';
import UtensilSelector from './create-post/UtensilSelector';
import IngredientList from './create-post/IngredientList';

export default function CreatePostModal({ visible, onClose, onBack, imageUri, onSubmit }) {
    const { theme } = useTheme();
    
    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [cookTime, setCookTime] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [selectedUtensils, setSelectedUtensils] = useState([]);
    const [ingredients, setIngredients] = useState(['']);
    const [instructions, setInstructions] = useState('');
    
    // Validation
    const hasValidIngredients = ingredients.some(i => i.trim().length > 0);
    const isValid = title.trim() && description.trim() && cookTime.trim() && hasValidIngredients;

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
        resetForm();
    };

    const handleClose = () => { resetForm(); onClose(); };
    const handleBackPress = () => { resetForm(); onBack?.(); };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={[styles.container, { backgroundColor: theme.screenBackground }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Pressable onPress={onBack ? handleBackPress : handleClose} style={styles.headerButton}>
                            <Ionicons name={onBack ? "arrow-back" : "close"} size={fp(24)} color={theme.textPrimary} />
                        </Pressable>
                        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Create Post</Text>
                        <Pressable onPress={handleSubmit} style={[styles.postButton, !isValid && styles.postButtonDisabled]}>
                            <Text style={[styles.postButtonText, !isValid && { color: theme.textTertiary }]}>Post</Text>
                        </Pressable>
                    </View>

                    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {imageUri && (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>Title <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
                                placeholder="What did you make?"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={50}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>Description <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
                                placeholder="Tell us about your dish..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={3}
                                maxLength={200}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>Cook Time <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
                                placeholder="e.g. 30 min"
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
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerButton: { padding: 12, marginLeft: -4 },
    headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', marginLeft: -28 },
    postButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#3B82F6', borderRadius: 20 },
    postButtonDisabled: { backgroundColor: '#E5E7EB' },
    postButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
    scrollContainer: { flex: 1 },
    scrollContent: { padding: 20 },
    imagePreviewContainer: { marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
    imagePreview: { width: '100%', height: 200, backgroundColor: '#F3F4F6' },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    required: { color: '#EF4444' },
    input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    instructionsArea: { minHeight: 140, textAlignVertical: 'top', paddingTop: 12 },
});
