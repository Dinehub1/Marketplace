import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ─── Article Data ─────────────────────────────────────────────────────────────
type Article = {
    id: string;
    title: string;
    summary: string;
    duration: string;
    category: string;
    emoji: string;
    featured?: boolean;
};

const ARTICLES: Article[] = [
    // Featured
    {
        id: '1', title: 'Understanding Your 4 Cycle Phases',
        summary: 'Learn how your body changes through menstruation, follicular, ovulation, and luteal phases — and how to optimise each one.',
        duration: '5 min', category: 'Education', emoji: '🔬', featured: true,
    },
    // Nutrition
    {
        id: '2', title: 'Iron-Rich Foods for Your Period',
        summary: 'Combat fatigue and replenish iron stores with these delicious meal ideas.',
        duration: '3 min', category: 'Nutrition', emoji: '🥗',
    },
    {
        id: '3', title: 'Anti-Inflammatory Diet Guide',
        summary: 'Reduce bloating and cramps naturally with omega-3s, turmeric, and more.',
        duration: '4 min', category: 'Nutrition', emoji: '🫚',
    },
    {
        id: '4', title: 'Hormone-Balancing Smoothie Recipes',
        summary: '5 easy smoothie recipes packed with seeds, berries, and adaptogens.',
        duration: '3 min', category: 'Nutrition', emoji: '🥤',
    },
    // Fitness
    {
        id: '5', title: 'Yoga Poses for Cramp Relief',
        summary: 'Gentle restorative poses that ease lower back pain and abdominal cramps.',
        duration: '7 min', category: 'Fitness', emoji: '🧘‍♀️',
    },
    {
        id: '6', title: 'Workout by Cycle Phase',
        summary: 'Match your exercise intensity to your hormonal phase for best results.',
        duration: '6 min', category: 'Fitness', emoji: '💪',
    },
    {
        id: '7', title: 'Walking for Period Pain',
        summary: 'Why a 20-minute walk can be more effective than painkillers for mild cramps.',
        duration: '3 min', category: 'Fitness', emoji: '🚶‍♀️',
    },
    // Health
    {
        id: '8', title: 'Sleep & Hormones: The Link',
        summary: 'How progesterone and estrogen affect your sleep quality across your cycle.',
        duration: '4 min', category: 'Health', emoji: '😴',
    },
    {
        id: '9', title: 'When to See a Doctor',
        summary: 'Key signs that your cycle symptoms may need medical attention.',
        duration: '5 min', category: 'Health', emoji: '🩺',
    },
    {
        id: '10', title: 'Stress & Your Cycle',
        summary: 'How cortisol disrupts ovulation and what you can do about it.',
        duration: '4 min', category: 'Health', emoji: '🧠',
    },
    // Wellness
    {
        id: '11', title: 'Journal Prompts for Each Phase',
        summary: 'Reflective questions tailored to your energy and emotional state each week.',
        duration: '3 min', category: 'Wellness', emoji: '📝',
    },
    {
        id: '12', title: 'Self-Care Rituals That Work',
        summary: 'Evidence-based self-care practices beyond bubble baths — for real relief.',
        duration: '5 min', category: 'Wellness', emoji: '🕯️',
    },
    {
        id: '13', title: 'Seed Cycling Explained',
        summary: 'Can flax, pumpkin, sunflower, and sesame seeds really balance hormones?',
        duration: '4 min', category: 'Wellness', emoji: '🌻',
    },
    // Education
    {
        id: '14', title: 'BBT Tracking: A Beginner Guide',
        summary: 'How to measure basal body temperature and what the data tells you.',
        duration: '6 min', category: 'Education', emoji: '🌡️',
    },
    {
        id: '15', title: 'Cervical Mucus Patterns',
        summary: 'A visual guide to understanding your fertility signs throughout your cycle.',
        duration: '5 min', category: 'Education', emoji: '🔍',
    },
];

const CATEGORIES = ['All', 'Education', 'Nutrition', 'Fitness', 'Health', 'Wellness'];

const categoryColors: Record<string, (c: any) => string> = {
    Education: (c) => c.primary,
    Nutrition: (c) => c.fertile,
    Fitness: (c) => c.ovulation,
    Health: (c) => c.period,
    Wellness: (c) => c.luteal,
};

const categoryIcons: Record<string, string> = {
    Education: 'school-outline',
    Nutrition: 'nutrition-outline',
    Fitness: 'fitness-outline',
    Health: 'heart-outline',
    Wellness: 'leaf-outline',
};

// ─── Component ────────────────────────────────────────────────────────────────
const DiscoverScreen = () => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const router = useRouter();
    const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

    const toggleBookmark = useCallback((id: string) => {
        setBookmarks(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const filteredArticles = useMemo(() => {
        return ARTICLES.filter(a => {
            const matchesCategory = activeCategory === 'All' || a.category === activeCategory;
            const matchesSearch = searchQuery.length === 0 ||
                a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.summary.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery]);

    const featured = ARTICLES.find(a => a.featured);
    const showFeatured = activeCategory === 'All' && searchQuery.length === 0 && featured;

    const renderArticle = useCallback(({ item, index }: { item: Article; index: number }) => {
        const catColor = (categoryColors[item.category] ?? (() => colors.primary))(colors);
        const isBookmarked = bookmarks.has(item.id);

        return (
            <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 200)).duration(350)}>
                <TouchableOpacity
                    style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/article?id=${item.id}`)}
                >
                    {/* Emoji Icon */}
                    <View style={[styles.cardEmoji, { backgroundColor: catColor + '12' }]}>
                        <Text style={styles.cardEmojiText}>{item.emoji}</Text>
                    </View>

                    {/* Content */}
                    <View style={styles.cardContent}>
                        <View style={styles.cardTopRow}>
                            <View style={[styles.categoryBadge, { backgroundColor: catColor + '15' }]}>
                                <Text style={[styles.categoryText, { color: catColor }]}>{item.category}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => toggleBookmark(item.id)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons
                                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                                    size={18}
                                    color={isBookmarked ? colors.primary : colors.textTertiary}
                                />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                        <Text style={[styles.cardSummary, { color: colors.textSecondary }]} numberOfLines={2}>{item.summary}</Text>
                        <View style={styles.cardMeta}>
                            <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={12} color={colors.textTertiary} ></Ionicons>
                                <Text style={[styles.metaText, { color: colors.textTertiary }]}>{item.duration}</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    }, [colors, bookmarks, toggleBookmark]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Discover</Text>
                    <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                        {ARTICLES.length} articles · Learn & grow
                    </Text>
                </View>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <Ionicons name="search-outline" size={18} color={colors.textTertiary} style={styles.searchIcon} ></Ionicons>
                <TextInput
                    placeholder="Search articles, topics..."
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={colors.textTertiary} ></Ionicons>
                    </TouchableOpacity>
                )}
            </View>

            {/* Category Pills */}
            <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {CATEGORIES.map(cat => {
                        const isActive = activeCategory === cat;
                        const catColor = cat === 'All' ? colors.primary :
                            (categoryColors[cat] ?? (() => colors.primary))(colors);
                        return (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setActiveCategory(cat)}
                                style={[
                                    styles.filterPill,
                                    {
                                        backgroundColor: isActive ? catColor : colors.backgroundSecondary,
                                        borderColor: isActive ? catColor : colors.border,
                                    }
                                ]}
                            >
                                {cat !== 'All' && (
                                    <Ionicons
                                        name={categoryIcons[cat] as any}
                                        size={14}
                                        color={isActive ? '#fff' : colors.textSecondary}
                                    />
                                )}
                                <Text style={[
                                    styles.filterText,
                                    { color: isActive ? '#fff' : colors.textSecondary }
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Article List */}
            <FlatList
                data={filteredArticles.filter(a => !a.featured || !showFeatured)}
                renderItem={renderArticle}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    filteredArticles.length === 0 && styles.listContentEmpty,
                ]}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    showFeatured ? (
                        <TouchableOpacity
                            style={[styles.featuredCard, { backgroundColor: colors.primary }]}
                            activeOpacity={0.85}
                            onPress={() => router.push(`/article?id=${featured!.id}`)}
                        >
                            <View style={styles.featuredBadge}>
                                <Ionicons name="star" size={12} color="#fff" ></Ionicons>
                                <Text style={styles.featuredBadgeText}>FEATURED</Text>
                            </View>
                            <Text style={styles.featuredEmoji}>{featured!.emoji}</Text>
                            <Text style={styles.featuredTitle}>{featured!.title}</Text>
                            <Text style={styles.featuredSummary}>{featured!.summary}</Text>
                            <View style={styles.featuredMeta}>
                                <View style={styles.featuredMetaItem}>
                                    <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" ></Ionicons>
                                    <Text style={styles.featuredMetaText}>{featured!.duration}</Text>
                                </View>
                                <View style={styles.featuredMetaItem}>
                                    <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.8)" ></Ionicons>
                                    <Text style={styles.featuredMetaText}>{featured!.category}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="search" size={40} color={colors.primary} ></Ionicons>
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No articles found</Text>
                        <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                            Try a different search term or category.
                        </Text>
                        <TouchableOpacity
                            style={[styles.emptyCTA, { borderColor: colors.primary }]}
                            onPress={() => { setSearchQuery(''); setActiveCategory('All'); }}
                        >
                            <Text style={[styles.emptyCTAText, { color: colors.primary }]}>Clear Filters</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    headerTitle: { ...Typography.h2 },
    headerSub: { ...Typography.caption, marginTop: 2 },

    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.lg,
        paddingHorizontal: Spacing.md,
        height: 44,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
        borderWidth: 1,
    },
    searchIcon: { marginRight: Spacing.sm },
    searchInput: {
        flex: 1,
        fontFamily: 'Manrope_400Regular',
        fontSize: 15,
    },

    // Filters
    filterWrapper: { marginBottom: Spacing.sm },
    filterScroll: { paddingHorizontal: Spacing.lg, paddingBottom: 6 },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: BorderRadius.full,
        marginRight: 8,
        borderWidth: 1,
        gap: 5,
    },
    filterText: {
        fontFamily: 'Manrope_600SemiBold',
        fontSize: 13,
    },

    // Featured Card
    featuredCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        marginBottom: 12,
    },
    featuredBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'Manrope_700Bold',
        letterSpacing: 0.5,
    },
    featuredEmoji: { fontSize: 40, marginBottom: 8 },
    featuredTitle: {
        fontSize: 20,
        fontFamily: 'Manrope_700Bold',
        color: '#fff',
        marginBottom: 6,
        lineHeight: 26,
    },
    featuredSummary: {
        fontSize: 14,
        fontFamily: 'Manrope_400Regular',
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 20,
        marginBottom: 14,
    },
    featuredMeta: {
        flexDirection: 'row',
        gap: 16,
    },
    featuredMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    featuredMetaText: {
        fontSize: 12,
        fontFamily: 'Manrope_500Medium',
        color: 'rgba(255,255,255,0.8)',
    },

    // Article Cards
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 40,
    },
    listContentEmpty: { flexGrow: 1 },
    card: {
        flexDirection: 'row',
        borderRadius: BorderRadius.xl,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
    },
    cardEmoji: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    cardEmojiText: { fontSize: 28 },
    cardContent: {
        flex: 1,
        marginLeft: 12,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    categoryText: {
        fontSize: 10,
        fontFamily: 'Manrope_700Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    cardTitle: {
        fontSize: 15,
        fontFamily: 'Manrope_700Bold',
        lineHeight: 20,
        marginBottom: 3,
    },
    cardSummary: {
        fontSize: 12,
        fontFamily: 'Manrope_400Regular',
        lineHeight: 17,
        marginBottom: 6,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    metaText: {
        fontSize: 11,
        fontFamily: 'Manrope_500Medium',
    },

    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: 60,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        ...Typography.h4,
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    emptyDescription: {
        ...Typography.body,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    emptyCTA: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
    },
    emptyCTAText: {
        fontFamily: 'Manrope_600SemiBold',
        fontSize: 14,
    },
});

export default DiscoverScreen;
