import React, { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import { getCloudinaryUrl } from '../../../utils/cloudinaryUrl';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, FlatList, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../../utils/responsive';
import { api } from '../../../services/api';
import { AuthContext } from '../../../context/AuthContext';
import DishDetailModal from '../../posts/DishDetailModal';

const AVAILABLE_UTENSILS = [
    { id: 'oven', label: 'Oven', icon: 'tablet-landscape-outline' },
    { id: 'stove', label: 'Stove', icon: 'flame-outline' },
    { id: 'mixer', label: 'Mixer', icon: 'sync-outline' },
    { id: 'blender', label: 'Blender', icon: 'color-wand-outline' },
    { id: 'microwave', label: 'Microwave', icon: 'tv-outline' },
    { id: 'grill', label: 'Grill', icon: 'bonfire-outline' },
    { id: 'airfryer', label: 'Air Fryer', icon: 'leaf-outline' },
    { id: 'pot', label: 'Pot', icon: 'water-outline' },
    { id: 'wok', label: 'Wok', icon: 'restaurant-outline' },
];

export default function FindRecipeModal({ visible, onClose, theme }) {
    const { token } = useContext(AuthContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUtensils, setSelectedUtensils] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [failedImages, setFailedImages] = useState(new Set());

    // For dish details
    const [selectedDish, setSelectedDish] = useState(null);
    const [dishDetailVisible, setDishDetailVisible] = useState(false);

    const fetchIdRef = useRef(0);

    const fetchResults = useCallback(async () => {
        if (!token) return;
        const fetchId = ++fetchIdRef.current;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            const trimmed = searchQuery.trim();
            if (trimmed) params.append('query', trimmed);
            if (selectedUtensils.length > 0) params.append('utensils', selectedUtensils.join(','));
            const data = await api.get(`/posts/search?${params.toString()}`, token);
            if (fetchId === fetchIdRef.current) {
                    const raw = data || [];
                    // User's own recipes (isGlobal=false) pinned first, sorted A→Z.
                    // Global reference recipes follow, also sorted A→Z by title.
                    const ownRecipes = raw.filter(r => !r.isGlobal).sort((a, b) => a.title.localeCompare(b.title));
                    const globalRecipes = raw.filter(r => r.isGlobal).sort((a, b) => a.title.localeCompare(b.title));
                    setResults([...ownRecipes, ...globalRecipes]);
                }
        } catch (error) {
            console.error('[FindRecipeModal:fetchResults] Error:', error.message);
            if (fetchId === fetchIdRef.current) setResults([]);
        } finally {
            if (fetchId === fetchIdRef.current) setLoading(false);
        }
    }, [searchQuery, selectedUtensils, token]);

    // Fetch immediately when modal opens (no debounce delay on open)
    useEffect(() => {
        if (visible) fetchResults();
    }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced fetch on query or utensil changes
    useEffect(() => {
        if (!visible) return;
        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [fetchResults, visible]);

    const toggleUtensil = (id) => {
        if (selectedUtensils.includes(id)) {
            setSelectedUtensils(selectedUtensils.filter(u => u !== id));
        } else {
            setSelectedUtensils([...selectedUtensils, id]);
        }
    };

    const getDifficultyColor = (difficulty) => {
        if (!difficulty) return '#6B7280';
        switch (difficulty.toLowerCase()) {
            case 'easy': return '#10B981';
            case 'medium': return '#F59E0B';
            case 'hard': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const handleOpenDish = (item) => {
        setSelectedDish(item);
        setDishDetailVisible(true);
    };

    return (
        <Modal 
            visible={visible} 
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.fullScreenModal, { backgroundColor: theme.background }]}>
                <View style={styles.modalHeader}>
                    <View>
                        <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Find Recipe</Text>
                        <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Filter by what you have</Text>
                    </View>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={theme.textPrimary} />
                    </Pressable>
                </View>

                <View style={[styles.searchContainer, { backgroundColor: theme.cardBackgroundAlt }]}>
                    <Ionicons name="search" size={20} color={theme.textSecondary} />
                    <TextInput 
                        style={[styles.searchInput, { color: theme.textPrimary }]}
                        placeholder="Search ingredients, names..."
                        placeholderTextColor={theme.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {loading && <ActivityIndicator size="small" color={theme.primary} style={{marginLeft: 10}} />}
                </View>

                <View style={styles.filterSection}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Your Kitchen Tools</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                        {AVAILABLE_UTENSILS.map((utensil) => {
                            const isSelected = selectedUtensils.includes(utensil.id);
                            return (
                                <Pressable
                                    key={utensil.id}
                                    onPress={() => toggleUtensil(utensil.id)}
                                    style={[
                                        styles.chip,
                                        { 
                                            backgroundColor: isSelected ? theme.primary : theme.cardBackgroundAlt,
                                            borderColor: isSelected ? theme.primary : 'transparent',
                                        }
                                    ]}
                                >
                                    <Ionicons 
                                        name={utensil.icon} 
                                        size={16} 
                                        color={isSelected ? '#fff' : theme.textSecondary} 
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text style={{ 
                                        color: isSelected ? '#fff' : theme.textSecondary,
                                        fontWeight: isSelected ? '600' : '400',
                                        fontSize: fp(14)
                                    }}>
                                        {utensil.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                <View style={styles.resultsSection}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: hp(10) }]}>
                        Results ({results.length})
                    </Text>
                    
                    <FlatList 
                        data={results}
                        keyExtractor={item => String(item.id)}
                        contentContainerStyle={{ paddingBottom: hp(40) }}
                        ListEmptyComponent={() => (
                            !loading && (
                                <View style={styles.emptyResults}>
                                    <Ionicons name="search-outline" size={48} color={theme.textTertiary} />
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                        No recipes found
                                    </Text>
                                    <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
                                        Try a different search term
                                    </Text>
                                </View>
                            )
                        )}
                        renderItem={({ item }) => {
                            const getSourceColor = () => {
                                if (item.isGlobal) return '#3B82F6';
                                return '#10B981';
                            };
                            
                            const getSourceIcon = () => {
                                if (item.isGlobal) return 'book-outline';
                                return 'person';
                            };

                            const getSourceDisplay = () => {
                                if (item.isGlobal) return 'Reference';
                                return 'Own';
                            };

                            return (
                                <Pressable 
                                    onPress={() => handleOpenDish(item)}
                                    style={({ pressed }) => [
                                        styles.recipeCard, 
                                        { 
                                            backgroundColor: theme.cardBackground, 
                                            shadowColor: theme.shadowColor,
                                            opacity: pressed ? 0.7 : 1,
                                            transform: [{ scale: pressed ? 0.98 : 1 }]
                                        }
                                    ]}
                                >
                                    {item.image && !failedImages.has(item.id) ? (
                                        <View style={styles.imageContainer}>
                                            <Image
                                                source={{ uri: getCloudinaryUrl(item.image, { width: 120, height: 120, crop: 'fill' }) }}
                                                style={styles.recipeImage}
                                                onError={() => setFailedImages(prev => new Set(prev).add(item.id))}
                                            />
                                        </View>
                                    ) : (
                                        <View style={[styles.recipeImagePlaceholder, { backgroundColor: theme.cardBackgroundAlt }]}>
                                            <Ionicons name="restaurant" size={30} color={theme.textTertiary} />
                                        </View>
                                    )}
                                    
                                    <View style={styles.recipeInfo}>
                                        <View style={styles.recipeNameRow}>
                                            <Text style={[styles.recipeName, { color: theme.textPrimary, flex: 1 }]} numberOfLines={1}>
                                                {item.title}
                                            </Text>
                                            <View style={[styles.sourceBadge, { backgroundColor: getSourceColor() + '20' }]}>
                                                <Ionicons name={getSourceIcon()} size={10} color={getSourceColor()} style={{ marginRight: 3 }} />
                                                <Text style={[styles.sourceText, { color: getSourceColor() }]}>{getSourceDisplay()}</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.recipeMetaRow}>
                                            <View style={styles.metaBadge}>
                                                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                                                <Text style={[styles.metaText, { color: theme.textSecondary }]}>{item.cookTime || item.time}</Text>
                                            </View>
                                            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
                                                <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>{item.difficulty}</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.toolsRow}>
                                            {(item.utensils || []).slice(0, 3).map((toolId, index) => (
                                                <View key={`${item.id}-${toolId}-${index}`} style={[
                                                    styles.miniToolDot, 
                                                    { backgroundColor: selectedUtensils.includes(toolId) ? '#10B981' : theme.textTertiary } 
                                                ]} />
                                            ))}
                                            <Text style={[styles.metaText, { fontSize: fp(10), color: theme.textTertiary, marginLeft: 4 }]} numberOfLines={1}>
                                                {(item.utensils || []).join(', ')}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                </Pressable>
                            )
                        }}
                    />
                </View>
            </View>

            <DishDetailModal 
                visible={dishDetailVisible}
                onClose={() => {
                    setDishDetailVisible(false);
                    setSelectedDish(null);
                }}
                dish={selectedDish}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    fullScreenModal: {
        flex: 1,
        paddingTop: hp(20), 
        paddingHorizontal: wp(20),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(20),
    },
    modalTitle: {
        fontSize: fp(24),
        fontWeight: '800',
    },
    modalSubtitle: {
        fontSize: fp(14),
        marginTop: hp(4),
    },
    closeButton: {
        padding: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(12),
        borderRadius: wp(12),
        marginBottom: hp(20),
    },
    searchInput: {
        flex: 1,
        marginLeft: wp(10),
        fontSize: fp(16),
    },
    filterSection: {
        marginBottom: hp(24),
    },
    sectionTitle: {
        fontSize: fp(16),
        fontWeight: '700',
        marginBottom: hp(12),
    },
    chipsContainer: {
        gap: wp(10),
        paddingRight: wp(20),
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(8),
        paddingHorizontal: wp(16),
        borderRadius: 20,
        borderWidth: 1,
    },
    resultsSection: {
        flex: 1,
    },
    recipeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(12),
        borderRadius: wp(16),
        marginBottom: hp(12),
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    recipeImagePlaceholder: {
        width: wp(60),
        height: wp(60),
        borderRadius: wp(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(16),
    },
    imageContainer: {
        width: wp(60),
        height: wp(60),
        borderRadius: wp(12),
        overflow: 'hidden',
        marginRight: wp(16),
    },
    recipeImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    recipeInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    recipeName: {
        fontSize: fp(16),
        fontWeight: '700',
        marginBottom: hp(6),
    },
    recipeMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(12),
        marginBottom: hp(6),
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: fp(12),
    },
    difficultyBadge: {
        paddingHorizontal: wp(8),
        paddingVertical: hp(2),
        borderRadius: wp(6),
    },
    difficultyText: {
        fontSize: fp(11),
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    toolsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    miniToolDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    recipeNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: hp(4),
    },
    sourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(6),
        paddingVertical: hp(2),
        borderRadius: wp(4),
        marginLeft: wp(8),
    },
    sourceText: {
        fontSize: fp(9),
        fontWeight: '600',
    },
    emptyResults: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(40),
    },
    emptyText: {
        fontSize: fp(16),
        fontWeight: '600',
        marginTop: hp(12),
    },
    emptySubtext: {
        fontSize: fp(13),
        marginTop: hp(4),
    },
});
