import { useState, useMemo } from 'react';
import { Text, View, StyleSheet, Pressable, Modal, TextInput, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import CameraScreen from '../media/CameraScreen';
import { uploadImage } from '../../utils/photoHandling';
import CreatePostModal from '../posts/CreatePostModal';
import RequestChefReviewModal from '../posts/RequestChefReviewModal';
import { mockMyRecipes, mockFavoriteRecipes, mockCommunityPosts } from '../../data/mockData';


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

// Combine all recipes with source indicators, prioritized
const getAllSearchableRecipes = () => {
    // Priority 1: My Recipes (source: 'own')
    const myRecipes = mockMyRecipes.map(recipe => ({
        ...recipe,
        source: 'own',
        sourceDisplay: 'Own',
    }));

    // Priority 2: Favorites (source: 'favorite')
    const favorites = mockFavoriteRecipes.map(recipe => ({
        ...recipe,
        source: 'favorite',
        sourceDisplay: 'Favorite',
    }));

    // Priority 3: Community (source: '@author')
    const community = mockCommunityPosts.map(post => ({
        id: `community-${post.id}`,
        name: post.title,
        title: post.title,
        tools: post.utensils || [],
        difficulty: post.difficulty || 'Medium',
        time: post.cookTime || '30m',
        source: 'community',
        sourceDisplay: `@${post.author}`,
        originalPost: post,
    }));

    return [...myRecipes, ...favorites, ...community];
};

export default function MainActions() {
    const { theme } = useTheme();
    
    // Existing State
    const [sourceModalVisible, setSourceModalVisible] = useState(false);
    const [cameraModalVisible, setCameraModalVisible] = useState(false);
    const [nextStepModalVisible, setNextStepModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [modalKey, setModalKey] = useState(0);
    
    // NEW: Create Post Modal State
    const [createPostModalVisible, setCreatePostModalVisible] = useState(false);

    // --- NEW STATE FOR FIND RECIPE ---
    const [findRecipeModalVisible, setFindRecipeModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUtensils, setSelectedUtensils] = useState([]);

    // Upload Chef review modal state
    const [chefReviewModalVisible, setChefReviewModalVisible] = useState(false);
    // --- HELPER FOR DIFFICULTY COLOR ---
    const getDifficultyColor = (difficulty) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return '#10B981';
            case 'medium': return '#F59E0B';
            case 'hard': return '#EF4444';
            default: return '#6B7280';
        }
    };

    // --- FIND RECIPE HANDLERS ---
    const handleFindRecipe = () => {
        setFindRecipeModalVisible(true);
    };

    const toggleUtensil = (id) => {
        if (selectedUtensils.includes(id)) {
            setSelectedUtensils(selectedUtensils.filter(u => u !== id));
        } else {
            setSelectedUtensils([...selectedUtensils, id]);
        }
    };

    const filteredRecipes = useMemo(() => {
        const allRecipes = getAllSearchableRecipes();
        return allRecipes.filter(recipe => {
            const recipeName = recipe.name || recipe.title || '';
            const matchesSearch = recipeName.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Filter by utensils - if any utensils are selected, recipe must have at least one of them
            const matchesUtensils = selectedUtensils.length === 0 || 
                (recipe.tools && recipe.tools.some(tool => selectedUtensils.includes(tool)));
            
            return matchesSearch && matchesUtensils; 
        });
    }, [searchQuery, selectedUtensils]);


    // --- EXISTING HANDLERS ---
    const handleUploadDish = () => {
        setSourceModalVisible(true);
    };

    const handleTakePhoto = () => {
        setSourceModalVisible(false);
        setTimeout(() => {
            setCameraModalVisible(true);
        }, 300);
    };

    const handlePhotoTaken = (uri) => {
        setSelectedImageUri(uri);
        setCameraModalVisible(false);
        setTimeout(() => {
            setModalKey(prev => prev + 1); 
            setNextStepModalVisible(true);
        }, 300);
    };

    const handleAccessGallery = async () => {
        const uri = await uploadImage('gallery');
        setSourceModalVisible(false);
        if (uri) {
            setSelectedImageUri(uri);
            setTimeout(() => {
                setModalKey(prev => prev + 1); 
                setNextStepModalVisible(true);
            }, 500);
        }
    };

    const handleGetAiRating = () => {
        setNextStepModalVisible(false);
        // TODO: Implement AI rating logic
        console.log('Getting AI rating for image:', selectedImageUri);
        setSelectedImageUri(null);
    };

    const handlePostToFeed = () => {
        setNextStepModalVisible(false);
        // Open the Create Post Modal with the image
        setTimeout(() => {
            setCreatePostModalVisible(true);
        }, 300);
    };

    const handleCreatePostSubmit = (postData) => {
        console.log('Post submitted:', postData);
        // TODO: Send to backend / add to context
        setCreatePostModalVisible(false);
        setSelectedImageUri(null);
    };

    const handlePostToFeedBack = () => {
        setCreatePostModalVisible(false);
        // Reopen the "What's next?" modal after a short delay
        setTimeout(() => {
            setNextStepModalVisible(true);
        }, 300);
    };

    const handleGetChefReview = () => {
    setNextStepModalVisible(false);
    // Open the Chef Review Modal
    setTimeout(() => {
        setChefReviewModalVisible(true);
    }, 300);
};

    const handleCancelAction = () => {
        setNextStepModalVisible(false);
        setSelectedImageUri(null);
    };

    const handleChefReviewSubmit = (reviewData) => {
    console.log('Chef review requested:', reviewData);
    // TODO: Send to backend
    setChefReviewModalVisible(false);
    setSelectedImageUri(null);
    };

    const handleChefReviewBack = () => {
    setChefReviewModalVisible(false);
    // Reopen the "What's next?" modal after a short delay
    setTimeout(() => {
        setNextStepModalVisible(true);
    }, 300);
};

    return (
        <View style={styles.container}>
            {/* FIND RECIPE CARD */}
            <Pressable 
                style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: theme.cardBackgroundLight, shadowColor: theme.shadowColor },
                    pressed && styles.cardPressed
                ]}
                onPress={handleFindRecipe}
            >
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: theme.textPrimary }]}>Find a Recipe</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Turn leftovers into something edible</Text>
                </View>
                <View style={[styles.iconContainer, { backgroundColor: theme.cardBackgroundAlt }]}>
                    <Ionicons name="search" size={fp(20)} color={theme.primary} />
                </View>
            </Pressable>

            {/* UPLOAD DISH CARD */}
            <Pressable 
                style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: theme.cardBackgroundLight, shadowColor: theme.shadowColor },
                    pressed && styles.cardPressed
                ]}
                onPress={handleUploadDish}
            >
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: theme.textPrimary }]}>Upload Your Dish</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Ready to be judged?</Text>
                </View>
                <View style={[styles.iconContainer, { backgroundColor: theme.cardBackgroundAlt }]}>
                    <Ionicons name="add" size={fp(20)} color={theme.primary} />
                </View>
            </Pressable>

            {/* FIND RECIPE MODAL */}            
            <Modal 
                visible={findRecipeModalVisible} 
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setFindRecipeModalVisible(false)}
            >
                <View style={[styles.fullScreenModal, { backgroundColor: theme.background }]}>
                    
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Find Recipe</Text>
                            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Filter by what you have</Text>
                        </View>
                        <Pressable onPress={() => setFindRecipeModalVisible(false)} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.textPrimary} />
                        </Pressable>
                    </View>

                    {/* Search Bar */}
                    <View style={[styles.searchContainer, { backgroundColor: theme.cardBackgroundAlt }]}>
                        <Ionicons name="search" size={20} color={theme.textSecondary} />
                        <TextInput 
                            style={[styles.searchInput, { color: theme.textPrimary }]}
                            placeholder="Search ingredients, names..."
                            placeholderTextColor={theme.textTertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Utensils Filter Section */}
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

                    {/* Results List */}
                    <View style={styles.resultsSection}>
                        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: hp(10) }]}>
                            Results ({filteredRecipes.length})
                        </Text>
                        
                        <FlatList 
                            data={filteredRecipes}
                            keyExtractor={item => String(item.id)}
                            contentContainerStyle={{ paddingBottom: hp(40) }}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyResults}>
                                    <Ionicons name="search-outline" size={48} color={theme.textTertiary} />
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                        No recipes found
                                    </Text>
                                    <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
                                        Try a different search term
                                    </Text>
                                </View>
                            )}
                            renderItem={({ item }) => {
                                // Determine source badge color
                                const getSourceColor = () => {
                                    switch (item.source) {
                                        case 'own': return '#10B981'; // green
                                        case 'favorite': return '#F59E0B'; // amber
                                        case 'community': return '#3B82F6'; // blue
                                        default: return theme.textTertiary;
                                    }
                                };
                                
                                const getSourceIcon = () => {
                                    switch (item.source) {
                                        case 'own': return 'person';
                                        case 'favorite': return 'heart';
                                        case 'community': return 'people';
                                        default: return 'document';
                                    }
                                };

                                return (
                                <Pressable 
                                    onPress={() => console.log('Selected Recipe ID:', item.id)}
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
                                    <View style={[styles.recipeImagePlaceholder, { backgroundColor: theme.cardBackgroundAlt }]}>
                                        <Ionicons name="restaurant" size={30} color={theme.textTertiary} />
                                    </View>
                                    
                                    <View style={styles.recipeInfo}>
                                        <View style={styles.recipeNameRow}>
                                            <Text style={[styles.recipeName, { color: theme.textPrimary, flex: 1 }]} numberOfLines={1}>
                                                {item.name || item.title}
                                            </Text>
                                            {/* Source Badge */}
                                            <View style={[
                                                styles.sourceBadge, 
                                                { backgroundColor: getSourceColor() + '20' }
                                            ]}>
                                                <Ionicons 
                                                    name={getSourceIcon()} 
                                                    size={10} 
                                                    color={getSourceColor()} 
                                                    style={{ marginRight: 3 }} 
                                                />
                                                <Text style={[
                                                    styles.sourceText, 
                                                    { color: getSourceColor() }
                                                ]}>
                                                    {item.sourceDisplay}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.recipeMetaRow}>
                                            <View style={styles.metaBadge}>
                                                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                                                <Text style={[styles.metaText, { color: theme.textSecondary }]}>{item.time}</Text>
                                            </View>
                                            <View style={[
                                                styles.difficultyBadge, 
                                                { backgroundColor: getDifficultyColor(item.difficulty) + '20' }
                                            ]}>
                                                <Text style={[
                                                    styles.difficultyText, 
                                                    { color: getDifficultyColor(item.difficulty) }
                                                ]}>
                                                    {item.difficulty}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.toolsRow}>
                                            {(item.tools || []).map((toolId, index) => (
                                                <View key={`${item.id}-${toolId}-${index}`} style={[
                                                    styles.miniToolDot, 
                                                    { backgroundColor: selectedUtensils.includes(toolId) ? '#10B981' : theme.textTertiary } 
                                                ]} />
                                            ))}
                                            <Text style={[styles.metaText, { fontSize: fp(10), color: theme.textTertiary, marginLeft: 4 }]}>
                                                {(item.tools || []).join(', ')}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                                </Pressable>
                            )}}
                        />
                    </View>
                </View>
            </Modal>

            {/* Step 1: Image Source Modal */}
            <Modal 
                visible={sourceModalVisible} 
                transparent={true} 
                animationType="fade"
                onRequestClose={() => setSourceModalVisible(false)}
            >
                <Pressable 
                    style={[styles.actionModalOverlay, { backgroundColor: theme.overlayBackgroundDark }]}
                    onPress={() => setSourceModalVisible(false)}
                >
                    <Pressable style={[styles.actionModalCard, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.actionModalHeader}>
                            <Text style={[styles.actionModalTitle, { color: theme.textPrimary }]}>Upload Your Dish</Text>
                            <Text style={[styles.actionModalSubtitle, { color: theme.textSecondary }]}>Choose how to add your photo</Text>
                        </View>

                        <View style={styles.actionButtonsContainer}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    { backgroundColor: theme.successLighter }, // UPDATED: Green background
                                    pressed && styles.actionButtonPressed
                                ]}
                                onPress={handleTakePhoto}
                            >
                                <View style={styles.actionTextContainer}>
                                    <Text style={[styles.actionButtonTitle, { color: theme.textPrimary }]}>Take Photo</Text>
                                    <Text style={[styles.actionButtonSubtitle, { color: theme.textSecondary }]}>Capture with your camera</Text>
                                </View>
                                {/* UPDATED: Green Arrow */}
                                <Text style={[styles.actionArrow, { color: theme.success }]}>→</Text>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    { backgroundColor: theme.primaryLightest }, // UPDATED: Blue background
                                    pressed && styles.actionButtonPressed
                                ]}
                                onPress={handleAccessGallery}
                            >
                                <View style={styles.actionTextContainer}>
                                    <Text style={[styles.actionButtonTitle, { color: theme.textPrimary }]}>Access Gallery</Text>
                                    <Text style={[styles.actionButtonSubtitle, { color: theme.textSecondary }]}>Choose from your photos</Text>
                                </View>
                                {/* UPDATED: Blue Arrow */}
                                <Text style={[styles.actionArrow, { color: theme.primary }]}>→</Text>
                            </Pressable>
                        </View>

                        <Pressable
                            style={({ pressed }) => [
                                styles.cancelButton,
                                { backgroundColor: theme.dangerLighter }, // UPDATED: Red background
                                pressed && styles.cancelButtonPressed
                            ]}
                            onPress={() => setSourceModalVisible(false)}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.dangerMuted }]}>Cancel</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Camera Modal */}
            <Modal 
                visible={cameraModalVisible} 
                animationType="slide"
                onRequestClose={() => setCameraModalVisible(false)}
            >
                <CameraScreen 
                    onPhotoTaken={handlePhotoTaken}
                    onClose={() => setCameraModalVisible(false)}
                />
            </Modal>

            {/* Step 2: Action Choice Modal */}
            <Modal 
                key={`next-step-${modalKey}`} 
                visible={nextStepModalVisible} 
                transparent={true} 
                animationType="fade"
                onRequestClose={() => setNextStepModalVisible(false)}
            >
                <Pressable 
                    style={[styles.actionModalOverlay, { backgroundColor: theme.overlayBackgroundDark }]}
                    onPress={() => setNextStepModalVisible(false)}
                >
                    <Pressable style={[styles.actionModalCard, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.actionModalHeader}>
                            <Text style={[styles.actionModalTitle, { color: theme.textPrimary }]}>What's next?</Text>
                            <Text style={[styles.actionModalSubtitle, { color: theme.textSecondary }]}>Choose an action for your dish</Text>
                        </View>

                        <View style={styles.actionButtonsContainer}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    { backgroundColor: theme.primaryLightest }, // UPDATED: Blue (matches Gallery)
                                    pressed && styles.actionButtonPressed
                                ]}
                                onPress={handlePostToFeed}
                            >
                                <View style={styles.actionTextContainer}>
                                    <Text style={[styles.actionButtonTitle, { color: theme.textPrimary }]}>Post to Feed</Text>
                                    <Text style={[styles.actionButtonSubtitle, { color: theme.textSecondary }]}>Share with the community</Text>
                                </View>
                                <Text style={[styles.actionArrow, { color: theme.primary }]}>→</Text>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    { backgroundColor: theme.warningLight }, 
                                    pressed && styles.actionButtonPressed
                                ]}
                                onPress={handleGetAiRating}
                            >
                                <View style={styles.actionTextContainer}>
                                    <Text style={[styles.actionButtonTitle, { color: theme.textPrimary }]}>Get AI Rating</Text>
                                    <Text style={[styles.actionButtonSubtitle, { color: theme.textSecondary }]}>Let AI judge your creation</Text>
                                </View>
                                <Text style={[styles.actionArrow, { color: theme.warning }]}>→</Text>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    { backgroundColor: theme.chefReviewButtonBg }, 
                                    pressed && styles.actionButtonPressed
                                ]}
                                onPress={handleGetChefReview}
                            >
                                <View style={styles.actionTextContainer}>
                                    <Text style={[styles.actionButtonTitle, { color: theme.textPrimary }]}>Get Chef Review</Text>
                                    <Text style={[styles.actionButtonSubtitle, { color: theme.textSecondary }]}>Get feedback from real chefs</Text>
                                </View>
                                <Text style={[styles.actionArrow, { color: theme.textTertiary }]}>→</Text>
                            </Pressable>
                        </View>

                        <Pressable
                            style={({ pressed }) => [
                                styles.cancelButton,
                                { backgroundColor: theme.dangerLighter }, // UPDATED: Red
                                pressed && styles.cancelButtonPressed
                            ]}
                            onPress={handleCancelAction}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.dangerMuted }]}>Cancel</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Create Post Modal */}
            <CreatePostModal
                visible={createPostModalVisible}
                onClose={() => {
                    setCreatePostModalVisible(false);
                    setSelectedImageUri(null);
                }}
                onBack={handlePostToFeedBack}
                imageUri={selectedImageUri}
                onSubmit={handleCreatePostSubmit}
            />

            {/* Request Chef Review Modal */}
            <RequestChefReviewModal
                visible={chefReviewModalVisible}
                onClose={() => {
                    setChefReviewModalVisible(false);
                    setSelectedImageUri(null);
                }}
                onBack={handleChefReviewBack}
                dish={{
                    id: 'temp-dish-id',
                    title: 'Your Dish',
                }}
                imageUri={selectedImageUri}
                onSubmit={handleChefReviewSubmit}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SPACING.screenPadding,
        paddingTop: SPACING.sectionGap,
        paddingBottom: hp(4),
        gap: SPACING.itemGap,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: SPACING.cardPadding,
        borderRadius: SPACING.radiusLarge,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(2) },
        shadowOpacity: 0.08,
        shadowRadius: wp(12),
        elevation: 3,
    },
    cardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    textContainer: {
        flex: 1,
        gap: hp(6),
    },
    title: {
        fontSize: fp(18),
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: fp(14),
        color: '#6B7280',
        fontWeight: '400',
        lineHeight: hp(20),
    },
    iconContainer: {
        width: wp(40),
        height: wp(40),
        borderRadius: wp(10),
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: wp(16),
        padding: 0,
    },
    fullScreenModal: {
        flex: 1,
        paddingTop: hp(50), 
        paddingHorizontal: SPACING.screenPadding,
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
    // Source badge styles for Find Recipe
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
    actionModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(24),
    },
    actionModalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: wp(24),
        width: '100%',
        maxWidth: wp(340),
        paddingVertical: hp(24),
        paddingHorizontal: wp(20),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(8) },
        shadowOpacity: 0.15,
        shadowRadius: wp(24),
        elevation: 12,
    },
    actionModalHeader: {
        alignItems: 'center',
        marginBottom: hp(24),
    },
    actionModalTitle: {
        fontSize: fp(20),
        fontWeight: '700',
        marginBottom: hp(4),
    },
    actionModalSubtitle: {
        fontSize: fp(14),
    },
    actionButtonsContainer: {
        gap: hp(8),
        marginBottom: hp(16),
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(16),
        paddingHorizontal: wp(16),
        borderRadius: wp(12),
    },
    actionButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    actionTextContainer: {
        flex: 1,
    },
    actionButtonTitle: {
        fontSize: fp(16),
        fontWeight: '600',
    },
    actionButtonSubtitle: {
        fontSize: fp(13),
        marginTop: hp(2),
    },
    actionArrow: {
        fontSize: fp(20),
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: hp(14),
        borderRadius: wp(12),
    },
    cancelButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    cancelButtonText: {
        fontSize: fp(16),
        fontWeight: "700",
    },
});