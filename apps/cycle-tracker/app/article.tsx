import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ─── Article content (matches discover.tsx IDs) ──────────────────────────────
const ARTICLE_CONTENT: Record<string, {
    title: string; emoji: string; category: string; duration: string;
    sections: { heading: string; body: string }[];
}> = {
    '1': {
        title: 'Understanding Your 4 Cycle Phases', emoji: '🔬', category: 'Education', duration: '5 min',
        sections: [
            { heading: 'Menstrual Phase (Days 1–5)', body: 'This is when your period occurs. Hormone levels drop, your uterine lining sheds, and you may feel tired or crampy. It\'s a great time to rest, reflect, and focus on gentle self-care.\n\nTip: Prioritise iron-rich foods like spinach, lentils, and dark chocolate to replenish what you lose.' },
            { heading: 'Follicular Phase (Days 1–13)', body: 'Overlapping with your period, this phase is when your body prepares for ovulation. Estrogen rises, boosting your energy, mood, and creativity. You\'ll feel increasingly motivated and social.\n\nTip: This is the best time for high-intensity workouts, starting new projects, and brainstorming.' },
            { heading: 'Ovulation (Day 14)', body: 'A mature egg is released from the ovary. This is your peak fertility window and often when you feel your best — confident, energetic, and communicative.\n\nTip: Schedule important meetings, social events, or creative work during this phase.' },
            { heading: 'Luteal Phase (Days 15–28)', body: 'After ovulation, progesterone rises to prepare for a potential pregnancy. If the egg isn\'t fertilised, hormone levels drop, and PMS symptoms may appear — bloating, irritability, food cravings.\n\nTip: Focus on complex carbs, magnesium-rich foods, and calming activities like yoga or journaling.' },
        ],
    },
    '2': {
        title: 'Iron-Rich Foods for Your Period', emoji: '🥗', category: 'Nutrition', duration: '3 min',
        sections: [
            { heading: 'Why Iron Matters', body: 'During menstruation, you lose iron through blood loss. This can lead to fatigue, dizziness, and brain fog. Eating iron-rich foods helps replenish your stores and keep energy levels stable.' },
            { heading: 'Top Iron-Rich Foods', body: '• Spinach and dark leafy greens\n• Red meat and liver\n• Lentils and chickpeas\n• Tofu and tempeh\n• Pumpkin seeds\n• Dark chocolate (70%+ cacao)\n• Fortified cereals' },
            { heading: 'Boost Absorption', body: 'Pair iron-rich foods with vitamin C (citrus, bell peppers, strawberries) to boost absorption by up to 6x. Avoid drinking tea or coffee with meals, as tannins can inhibit iron uptake.' },
        ],
    },
    '3': {
        title: 'Anti-Inflammatory Diet Guide', emoji: '🫚', category: 'Nutrition', duration: '4 min',
        sections: [
            { heading: 'Inflammation & Your Cycle', body: 'Prostaglandins — chemicals that trigger uterine contractions — are inflammatory. Higher levels mean worse cramps. An anti-inflammatory diet can significantly reduce period pain.' },
            { heading: 'Foods to Add', body: '• Fatty fish (salmon, sardines) — rich in omega-3s\n• Turmeric & ginger — natural anti-inflammatories\n• Berries — packed with antioxidants\n• Olive oil — healthy monounsaturated fats\n• Walnuts and flaxseeds' },
            { heading: 'Foods to Reduce', body: '• Processed sugar and refined carbs\n• Red meat in excess\n• Alcohol (increases prostaglandin production)\n• Fried and ultra-processed foods\n• Excessive caffeine' },
        ],
    },
    '4': {
        title: 'Hormone-Balancing Smoothie Recipes', emoji: '🥤', category: 'Nutrition', duration: '3 min',
        sections: [
            { heading: '1. The Seed Cycler', body: 'Blend: 1 tbsp ground flaxseed, 1 tbsp pumpkin seeds, 1 banana, 1 cup almond milk, 1 tsp honey.\n\nBest for: Follicular phase. Flax and pumpkin seeds support estrogen balance.' },
            { heading: '2. The Hormone Healer', body: 'Blend: 1 tbsp sunflower seeds, 1 tbsp sesame seeds, ½ cup berries, 1 cup oat milk, 1 scoop protein powder.\n\nBest for: Luteal phase. Sunflower and sesame support progesterone.' },
            { heading: '3. The Period Soother', body: 'Blend: 1 cup spinach, 1 banana, 1 tbsp cacao, 1 cup coconut milk, pinch of cinnamon.\n\nBest for: Menstrual phase. Iron from spinach + magnesium from cacao.' },
        ],
    },
    '5': {
        title: 'Yoga Poses for Cramp Relief', emoji: '🧘‍♀️', category: 'Fitness', duration: '7 min',
        sections: [
            { heading: 'Why Yoga Helps', body: 'Gentle yoga increases blood flow to the pelvic area, relaxes the uterine muscles, and releases endorphins — your body\'s natural painkillers. Even 10 minutes can make a noticeable difference.' },
            { heading: 'Child\'s Pose (Balasana)', body: 'Kneel on the floor, sit back on your heels, then fold forward with arms extended. Hold for 1–3 minutes. This gently compresses the abdomen and relieves lower back tension.' },
            { heading: 'Supine Twist', body: 'Lie on your back, bring one knee across your body while keeping shoulders flat. Hold 30 seconds each side. This releases tension in the lower back and stimulates digestion.' },
            { heading: 'Cat-Cow Stretch', body: 'On all fours, alternate between arching (cow) and rounding (cat) your back. Repeat 10 times. This warms up the spine and eases abdominal discomfort.' },
            { heading: 'Legs Up the Wall', body: 'Lie on your back with legs extended up a wall. Hold for 5–10 minutes. This reduces swelling, eases cramps, and calms the nervous system.' },
        ],
    },
    '6': {
        title: 'Workout by Cycle Phase', emoji: '💪', category: 'Fitness', duration: '6 min',
        sections: [
            { heading: 'Menstrual Phase', body: 'Energy is low. Stick to walking, gentle yoga, or light stretching. Listen to your body — rest days are productive days.' },
            { heading: 'Follicular Phase', body: 'Estrogen is rising, and so is your energy. Try HIIT, strength training, running, or learning new skills. Your body recovers faster in this phase.' },
            { heading: 'Ovulation Phase', body: 'Peak performance window. Go for your personal bests, try group sports, or tackle challenging workouts. You\'ll feel stronger and more confident.' },
            { heading: 'Luteal Phase', body: 'Energy begins to decline. Switch to moderate activities: pilates, swimming, cycling, or steady-state cardio. Avoid overtraining as cortisol is higher.' },
        ],
    },
    '7': {
        title: 'Walking for Period Pain', emoji: '🚶‍♀️', category: 'Fitness', duration: '3 min',
        sections: [
            { heading: 'The Evidence', body: 'A 2018 study in the Journal of Education and Health Promotion found that women who walked briskly for 30 minutes, 3 times a week, reported significantly less period pain than sedentary controls.' },
            { heading: 'How It Works', body: 'Walking boosts blood circulation, releases endorphins, and reduces prostaglandin levels — the chemicals responsible for cramps. It also improves mood and reduces stress.' },
            { heading: 'How to Start', body: 'Start with a gentle 15–20 minute walk when cramps begin. Keep a moderate pace — you should be able to talk but feel slightly breathless. Aim for flat terrain and comfortable shoes.' },
        ],
    },
    '8': {
        title: 'Sleep & Hormones: The Link', emoji: '😴', category: 'Health', duration: '4 min',
        sections: [
            { heading: 'The Hormonal Sleep Cycle', body: 'Progesterone, which rises after ovulation, has a natural sedative effect. But as it drops before your period, many women experience insomnia or restless sleep. Estrogen also influences serotonin and melatonin production.' },
            { heading: 'When Sleep Suffers Most', body: 'The late luteal phase (3–5 days before your period) is when sleep quality drops the most. Body temperature rises slightly, making it harder to fall and stay asleep.' },
            { heading: 'Tips for Better Sleep', body: '• Keep your bedroom cool (18–20°C)\n• Avoid screens 1 hour before bed\n• Try magnesium glycinate supplements\n• Use a consistent sleep schedule\n• Try chamomile tea or lavender aromatherapy\n• Light exercise earlier in the day' },
        ],
    },
    '9': {
        title: 'When to See a Doctor', emoji: '🩺', category: 'Health', duration: '5 min',
        sections: [
            { heading: 'Normal vs. Concerning', body: 'Some discomfort during your period is normal. But certain symptoms may indicate conditions like endometriosis, PCOS, or fibroids that benefit from early treatment.' },
            { heading: 'See a Doctor If...', body: '• Pain is severe enough to miss work/school\n• Periods last longer than 7 days\n• You soak through a pad/tampon every hour\n• Cycles are shorter than 21 days or longer than 35\n• You have spotting between periods\n• You experience sudden changes in your cycle\n• Pain during intercourse' },
            { heading: 'What to Expect', body: 'Your doctor may order blood tests (hormone levels, iron), an ultrasound, or refer you to a gynaecologist. Tracking your symptoms in this app can provide valuable data for your appointment.' },
        ],
    },
    '10': {
        title: 'Stress & Your Cycle', emoji: '🧠', category: 'Health', duration: '4 min',
        sections: [
            { heading: 'The Cortisol Connection', body: 'Chronic stress raises cortisol, which can suppress GnRH (gonadotropin-releasing hormone). This disrupts the signals your brain sends to your ovaries, potentially delaying or skipping ovulation.' },
            { heading: 'Signs Stress Is Affecting Your Cycle', body: '• Late or missed periods\n• Shorter luteal phase\n• Worsened PMS symptoms\n• Spotting between periods\n• Changes in flow volume' },
            { heading: 'Stress Management', body: '• Regular moderate exercise\n• Deep breathing (4-7-8 technique)\n• Journaling or talking to someone\n• Limiting caffeine and alcohol\n• Prioritising 7–9 hours of sleep\n• Adaptogens like ashwagandha (consult your doctor)' },
        ],
    },
    '11': {
        title: 'Journal Prompts for Each Phase', emoji: '📝', category: 'Wellness', duration: '3 min',
        sections: [
            { heading: 'Menstrual Phase', body: '• What do I need to let go of this cycle?\n• How can I honour my need for rest today?\n• What am I grateful for in my body?' },
            { heading: 'Follicular Phase', body: '• What new project or idea excites me?\n• What goals do I want to set for this cycle?\n• How do I want to show up this week?' },
            { heading: 'Ovulation Phase', body: '• What conversations have I been avoiding?\n• How can I share my gifts with others today?\n• What do I feel most confident about right now?' },
            { heading: 'Luteal Phase', body: '• What boundaries do I need to set?\n• Am I being kind to myself today?\n• What can I simplify or remove from my plate?' },
        ],
    },
    '12': {
        title: 'Self-Care Rituals That Work', emoji: '🕯️', category: 'Wellness', duration: '5 min',
        sections: [
            { heading: 'Beyond Bubble Baths', body: 'True self-care isn\'t just pampering — it\'s about meeting your body\'s needs. That might mean saying no to plans, eating a nourishing meal, or getting to bed early.' },
            { heading: 'Evidence-Based Practices', body: '• Heat therapy: A heating pad on your lower abdomen is clinically proven to reduce cramps\n• Progressive muscle relaxation: Tense and release each muscle group\n• Cold exposure: Brief cold showers boost mood and circulation\n• Nature time: 20 minutes outdoors reduces cortisol by 20%' },
            { heading: 'Build Your Ritual', body: 'Choose 2–3 practices that resonate with you and do them consistently. The power of ritual is in repetition — your nervous system learns to relax when it recognises the pattern.' },
        ],
    },
    '13': {
        title: 'Seed Cycling Explained', emoji: '🌻', category: 'Wellness', duration: '4 min',
        sections: [
            { heading: 'What Is Seed Cycling?', body: 'Seed cycling is the practice of eating specific seeds during different cycle phases to support hormone balance. While scientific evidence is limited, many women report benefits.' },
            { heading: 'The Protocol', body: 'Days 1–14 (Follicular): 1 tbsp each of ground flaxseeds and pumpkin seeds daily. These contain lignans and zinc that support estrogen metabolism.\n\nDays 15–28 (Luteal): 1 tbsp each of ground sunflower and sesame seeds daily. These contain selenium and vitamin E that support progesterone production.' },
            { heading: 'How to Start', body: 'Grind seeds fresh (or buy pre-ground and store in the freezer). Add to smoothies, yogurt, oatmeal, or salads. Give it 2–3 cycles to notice effects. Seed cycling is safe for most people but check with your doctor if you have a nut/seed allergy.' },
        ],
    },
    '14': {
        title: 'BBT Tracking: A Beginner Guide', emoji: '🌡️', category: 'Education', duration: '6 min',
        sections: [
            { heading: 'What Is BBT?', body: 'Basal Body Temperature (BBT) is your body\'s temperature at complete rest. After ovulation, progesterone causes a slight rise (0.2–0.5°C) that stays elevated until your next period.' },
            { heading: 'How to Measure', body: '• Use a BBT-specific thermometer (reads to 0.01°C)\n• Measure at the same time every morning BEFORE getting out of bed\n• Take your temperature orally or vaginally (be consistent)\n• Log it immediately in the app' },
            { heading: 'Reading Your Chart', body: 'Before ovulation: temps hover around 36.1–36.4°C\nAfter ovulation: temps rise to 36.4–36.8°C\n\nA sustained rise of 0.2°C+ for 3+ days confirms ovulation has occurred. Over several cycles, you\'ll see a clear biphasic pattern.' },
            { heading: 'Limitations', body: 'BBT confirms ovulation AFTER it happens — it can\'t predict it in advance. Illness, alcohol, poor sleep, and stress can all affect readings. Use BBT alongside other fertility signs for the most accurate picture.' },
        ],
    },
    '15': {
        title: 'Cervical Mucus Patterns', emoji: '🔍', category: 'Education', duration: '5 min',
        sections: [
            { heading: 'Why Track Mucus?', body: 'Cervical mucus changes throughout your cycle in response to estrogen and progesterone. These changes can help you identify your fertile window and confirm ovulation.' },
            { heading: 'The Patterns', body: '• After period: Dry or minimal discharge\n• Early follicular: Sticky, thick, white or cream\n• Pre-ovulation: Wet, creamy, increasing in volume\n• Ovulation: Clear, stretchy, egg-white consistency (most fertile)\n• After ovulation: Returns to thick, sticky, or dry' },
            { heading: 'How to Check', body: 'Check mucus on tissue after using the bathroom, or between clean fingers. Note the colour, consistency, and stretchiness. Log your observations daily in the app for the most useful data over time.' },
        ],
    },
};

const categoryColors: Record<string, (c: any) => string> = {
    Education: (c) => c.primary,
    Nutrition: (c) => c.fertile,
    Fitness: (c) => c.ovulation,
    Health: (c) => c.period,
    Wellness: (c) => c.luteal,
};

export default function ArticleScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [bookmarked, setBookmarked] = useState(false);

    const article = ARTICLE_CONTENT[id ?? ''];

    if (!article) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.errorState}>
                    <Text style={[styles.errorEmoji]}>📄</Text>
                    <Text style={[styles.errorTitle, { color: colors.text }]}>Article not found</Text>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const catColor = (categoryColors[article.category] ?? (() => colors.primary))(colors);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.headerBtn, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={20} color={colors.text} ></Ionicons>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                    style={[styles.headerBtn, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => setBookmarked(!bookmarked)}
                >
                    <Ionicons
                        name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={20}
                        color={bookmarked ? colors.primary : colors.text}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero */}
                <View style={[styles.hero, { backgroundColor: catColor + '10' }]}>
                    <Text style={styles.heroEmoji}>{article.emoji}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: catColor + '20' }]}>
                        <Text style={[styles.categoryText, { color: catColor }]}>{article.category}</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: colors.text }]}>{article.title}</Text>

                {/* Meta */}
                <View style={styles.metaRow}>
                    <View style={[styles.metaChip, { backgroundColor: colors.backgroundSecondary }]}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} ></Ionicons>
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{article.duration} read</Text>
                    </View>
                    <View style={[styles.metaChip, { backgroundColor: colors.backgroundSecondary }]}>
                        <Ionicons name="list-outline" size={14} color={colors.textSecondary} ></Ionicons>
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{article.sections.length} sections</Text>
                    </View>
                </View>

                {/* Sections */}
                {article.sections.map((section, i) => (
                    <View key={i} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionNumber, { backgroundColor: catColor + '15' }]}>
                                <Text style={[styles.sectionNumberText, { color: catColor }]}>{i + 1}</Text>
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.heading}</Text>
                        </View>
                        <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{section.body}</Text>
                    </View>
                ))}

                {/* Footer */}
                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                        This information is for educational purposes only and is not a substitute for professional medical advice.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },

    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 40,
    },

    // Hero
    hero: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        borderRadius: BorderRadius.xl,
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
    },
    heroEmoji: { fontSize: 56, marginBottom: 12 },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    categoryText: {
        fontSize: 12,
        fontFamily: 'Manrope_700Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Title
    title: {
        fontSize: 24,
        fontFamily: 'Manrope_700Bold',
        lineHeight: 32,
        marginBottom: Spacing.md,
    },

    // Meta
    metaRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: Spacing.xl,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        fontFamily: 'Manrope_500Medium',
    },

    // Sections
    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: Spacing.sm,
    },
    sectionNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionNumberText: {
        fontSize: 13,
        fontFamily: 'Manrope_700Bold',
    },
    sectionTitle: {
        flex: 1,
        fontSize: 17,
        fontFamily: 'Manrope_700Bold',
        lineHeight: 22,
    },
    sectionBody: {
        fontSize: 15,
        fontFamily: 'Manrope_400Regular',
        lineHeight: 24,
        marginLeft: 38,
    },

    // Footer
    footer: {
        borderTopWidth: 1,
        paddingTop: Spacing.lg,
        marginTop: Spacing.md,
    },
    footerText: {
        fontSize: 12,
        fontFamily: 'Manrope_400Regular',
        lineHeight: 18,
        textAlign: 'center',
        fontStyle: 'italic',
    },

    // Error
    errorState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    errorEmoji: { fontSize: 48 },
    errorTitle: { ...Typography.h4 },
    backButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: BorderRadius.lg,
        marginTop: 8,
    },
    backButtonText: {
        color: '#fff',
        fontFamily: 'Manrope_600SemiBold',
        fontSize: 15,
    },
});
