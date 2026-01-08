import { Text, View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';

const reviews = [
    {
        id: 1,
        title: "Quick & Easy",
        text: "This recipe is perfect for busy weeknights. Simple ingredients, amazing results!",
        chef: "Chef Gordon",
        initials: "GR"
    },
    {
        id: 2,
        title: "Family Favorite",
        text: "My kids absolutely love this dish. It's become our weekly staple.",
        chef: "Chef Maria",
        initials: "MG"
    },
    {
        id: 3,
        title: "Restaurant Quality",
        text: "Impressed my dinner guests with this one. Tastes like fine dining!",
        chef: "Chef Antoine",
        initials: "AS"
    },
    {
        id: 4,
        title: "Healthy & Delicious",
        text: "A nutritious meal that doesn't compromise on flavor. Highly recommend!",
        chef: "Chef Linda",
        initials: "LB"
    }
];

export default function FeaturedChef(){
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>From Chefs You Follow</Text>

                <Pressable 
                   style={({ pressed }) => [
                       styles.subtitleButton,
                       pressed && styles.subtitleButtonPressed
                   ]}
                    onPress={() => console.log("See what the pros think")}>
                    <View style={styles.subtitleContent}>
                        <Text style={styles.sectionSubtitle}>See what the pros think</Text>
                        <Ionicons name="arrow-forward" size={fp(14)} color="#BFDBFE" />
                    </View>
                </Pressable>
            
            </View>
            
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {reviews.map((review) => (
                    <Pressable 
                        key={review.id} 
                        style={({ pressed }) => [
                            styles.reviewCard,
                            pressed && styles.reviewCardPressed
                        ]}
                        onPress={() => console.log('Review pressed:', review.id)}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.chefAvatar}>
                                <Text style={styles.chefInitial}>{review.initials}</Text>
                            </View>
                            <Text style={styles.reviewTime}>{review.title}</Text>
                        </View>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.reviewContent}>
                            <Text style={styles.reviewText}>{review.text}</Text>
                            <Text style={styles.reviewChef}>{review.chef}</Text>
                        </View>
                    </Pressable>
                ))}
                
                {/* More Button */}
                <Pressable 
                    style={({ pressed }) => [
                        styles.moreCard,
                        pressed && styles.moreCardPressed
                    ]}
                    onPress={() => navigation.navigate('AllChefReviews')}
                >
                    <View style={styles.glassBackground}>
                        <View style={styles.moreCardContent}>
                            <Text style={styles.moreCardText}>More</Text>
                        </View>
                    </View>
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: SPACING.sectionGap,
        paddingBottom: hp(4),
    },
    header: {
        paddingHorizontal: SPACING.screenPadding,
        marginBottom: SPACING.itemGap,
    },
    sectionTitle: {
        fontSize: fp(22),
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: hp(4),
        letterSpacing: -0.5,
    },
    subtitleButton: {
        alignSelf: 'flex-start',
    },
    subtitleButtonPressed: {
        opacity: 0.7,
    },
    subtitleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
    },
    sectionSubtitle: {
        fontSize: fp(14),
        color: '#BFDBFE',
        fontWeight: '400',
    },
    scrollContainer: {
        paddingHorizontal: SPACING.screenPadding,
        gap: SPACING.itemGap,
    },
    reviewCard: {
        width: wp(280),
        backgroundColor: '#FFFFFF',
        borderRadius: wp(16),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(2) },
        shadowOpacity: 0.08,
        shadowRadius: wp(12),
        elevation: 3,
    },
    reviewCardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    cardHeader: {
        backgroundColor: '#F9FAFB',
        padding: wp(16),
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(12),
    },
    chefAvatar: {
        width: wp(56),
        height: wp(56),
        backgroundColor: '#3B82F6',
        borderRadius: wp(28),
        justifyContent: 'center',
        alignItems: 'center',
    },
    chefInitial: {
        fontSize: fp(20),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    reviewTime: {
        fontSize: fp(12),
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: wp(16),
    },
    reviewContent: {
        padding: wp(16),
        gap: hp(6),
        backgroundColor: '#FFFFFF',
    },
    reviewText: {
        fontSize: fp(16),
        fontWeight: '600',
        color: '#111827',
        lineHeight: hp(22),
    },
    reviewChef: {
        fontSize: fp(14),
        color: '#6B7280',
        fontWeight: '400',
        marginTop: hp(2),
    },
    moreCard: {
        alignSelf: 'center',
        width: wp(110),
        overflow: 'hidden',
        marginLeft: wp(4),
    },
    moreCardPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.96 }],
    },
    glassBackground: {
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        borderRadius: wp(25),
    },
    moreCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(12),
        paddingHorizontal: wp(24),
    },
    moreCardText: {
        fontSize: fp(14),
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
});