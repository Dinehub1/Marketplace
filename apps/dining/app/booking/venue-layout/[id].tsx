import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import VenueLayoutViewer from '../../../components/Events/VenueLayoutViewer';
import {
  getEventById,
  getLayoutForOccurrence,
  getOccurrenceById,
  getSectionsForLayout
} from '../../../config/supabase';
import { PremiumColors } from '../../../constants/Colors';
import { SectionWithAvailability } from '../../../utils/layoutService';

export default function VenueLayoutScreen() {
  const { id, occurrenceId } = useLocalSearchParams();
  const [event, setEvent] = useState<any>(null);
  const [occurrence, setOccurrence] = useState<any>(null);
  const [layout, setLayout] = useState<any>(null);
  const [sections, setSections] = useState<SectionWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id, occurrenceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🎪 ========================================');
      console.log('🎪 VENUE LAYOUT PAGE - LOADING DATA');
      console.log('🎪 ========================================');
      console.log('📍 Event ID:', id);
      console.log('📍 Occurrence ID:', occurrenceId);

      // 1. Load event
      console.log('📥 Step 1: Loading event...');
      const eventResult = await getEventById(id as string);
      console.log('📊 Event Result:', { 
        hasData: !!eventResult.data, 
        hasError: !!eventResult.error,
        error: eventResult.error 
      });
      
      if (eventResult.error || !eventResult.data) {
        console.error('❌ FAILED: Error loading event');
        console.error('❌ Error details:', JSON.stringify(eventResult.error, null, 2));
        Alert.alert('Error', 'Failed to load event details');
        return;
      }
      setEvent(eventResult.data);
      console.log('✅ SUCCESS: Event loaded');
      console.log('📋 Event Title:', eventResult.data.title);
      console.log('📋 Event Booking Type:', eventResult.data.booking_type);

      // 2. Load occurrence
      console.log('📥 Step 2: Loading occurrence...');
      if (!occurrenceId) {
        console.error('❌ FAILED: No occurrence ID provided');
        Alert.alert('Error', 'No occurrence selected');
        return;
      }

      const occurrenceResult = await getOccurrenceById(occurrenceId as string);
      console.log('📊 Occurrence Result:', { 
        hasData: !!occurrenceResult.data, 
        hasError: !!occurrenceResult.error,
        error: occurrenceResult.error 
      });
      
      if (occurrenceResult.error || !occurrenceResult.data) {
        console.error('❌ FAILED: Error loading occurrence');
        console.error('❌ Error details:', JSON.stringify(occurrenceResult.error, null, 2));
        Alert.alert('Error', 'Failed to load event occurrence');
        return;
      }
      setOccurrence(occurrenceResult.data);
      console.log('✅ SUCCESS: Occurrence loaded');
      console.log('📋 Occurrence Date:', occurrenceResult.data.occurrence_date);

      // 3. Load layout
      console.log('📥 Step 3: Loading layout for occurrence...');
      const layoutResult = await getLayoutForOccurrence(occurrenceId as string);
      console.log('📊 Layout Result:', { 
        hasData: !!layoutResult.data, 
        hasError: !!layoutResult.error,
        error: layoutResult.error,
        data: layoutResult.data 
      });
      
      if (layoutResult.error || !layoutResult.data) {
        console.error('❌ FAILED: Error loading layout');
        console.error('❌ Error details:', JSON.stringify(layoutResult.error, null, 2));
        console.error('❌ This usually means no layout exists for this occurrence');
        console.error('❌ Check database: SELECT * FROM event_layouts WHERE occurrence_id =', occurrenceId);
        Alert.alert('Error', 'No venue layout found for this event');
        return;
      }
      setLayout(layoutResult.data);
      console.log('✅ SUCCESS: Layout loaded');
      console.log('📋 Layout ID:', layoutResult.data.id);
      console.log('📋 Layout Name:', layoutResult.data.name);
      console.log('📋 SVG URL:', layoutResult.data.svg_url);
      console.log('📋 Viewbox:', layoutResult.data.viewbox);

      // 4. Load sections
      console.log('📥 Step 4: Loading sections for layout...');
      const sectionsResult = await getSectionsForLayout(layoutResult.data.id);
      console.log('📊 Sections Result:', { 
        hasData: !!sectionsResult.data, 
        hasError: !!sectionsResult.error,
        count: sectionsResult.data?.length || 0,
        error: sectionsResult.error 
      });
      
      if (sectionsResult.error) {
        console.error('❌ FAILED: Error loading sections');
        console.error('❌ Error details:', JSON.stringify(sectionsResult.error, null, 2));
        Alert.alert('Error', 'Failed to load venue sections');
        return;
      }

      // Add availability calculation
      const sectionsWithAvailability: SectionWithAvailability[] = (sectionsResult.data || []).map(section => ({
        ...section,
        available_capacity: section.capacity_total - section.capacity_booked,
        is_available: section.is_selectable && section.status === 'active' && (section.capacity_total - section.capacity_booked) > 0,
      }));

      setSections(sectionsWithAvailability);
      console.log('✅ SUCCESS: Sections loaded');
      console.log('📋 Total Sections:', sectionsWithAvailability.length);
      console.log('📋 Available Sections:', sectionsWithAvailability.filter(s => s.is_available).length);
      console.log('📋 Section Details:');
      sectionsWithAvailability.forEach(section => {
        console.log(`   - ${section.name}: ${section.available_capacity}/${section.capacity_total} available (${section.status})`);
      });
      
      console.log('🎪 ========================================');
      console.log('🎪 ALL DATA LOADED SUCCESSFULLY');
      console.log('🎪 ========================================');
    } catch (error) {
      console.error('❌ ========================================');
      console.error('❌ CRITICAL ERROR IN LOAD DATA');
      console.error('❌ ========================================');
      console.error('❌ Exception:', error);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
      console.log('🏁 Loading complete, setLoading(false)');
    }
  };

  const handleSectionPress = (section: SectionWithAvailability) => {
    console.log('🎯 Section selected:', section.name);
    console.log('📍 Navigating to section tickets page');
    
    // Navigate to section tickets page (similar to paid event flow)
    router.push({
      pathname: `/booking/section-tickets/${event.id}` as any,
      params: {
        occurrenceId: occurrenceId as string,
        sectionId: section.id,
        sectionName: section.name,
        eventTitle: event.title,
        eventImage: event.cover_image_url,
        eventVenue: event.venue || '',
        eventDate: occurrence?.occurrence_date || event.event_date,
        eventTime: event.start_time,
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
        <ActivityIndicator size="large" color={PremiumColors.accent.secondary} />
        <Text style={styles.loadingText}>Loading venue layout...</Text>
      </View>
    );
  }

  if (!event || !layout || !occurrence) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
        <Ionicons name="alert-circle-outline" size={64} color={PremiumColors.error} />
        <Text style={styles.errorText}>Failed to load venue layout</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backToEventButton}>
          <Text style={styles.backToEventText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={PremiumColors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{event.title}</Text>
          <Text style={styles.headerSubtitle}>
            {formatDate(occurrence.occurrence_date).split(',')[0]}, {occurrence.occurrence_date?.split('-')[2]} | {event.start_time || '7:00 PM'}
          </Text>
          <Text style={styles.headerLocation}>{event.venue || 'Venue'}, {event.city || 'City'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Layout Name */}
        <View style={styles.layoutInfoContainer}>
          <Text style={styles.layoutName}>{layout.name}</Text>
          <Text style={styles.layoutSubtext}>Select a section to view available tickets</Text>
        </View>

        {/* Venue Layout Viewer */}
        <VenueLayoutViewer
          svgUrl={layout.svg_url}
          sections={sections}
          onSectionPress={handleSectionPress}
          viewbox={layout.viewbox}
        />

        {/* Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: PremiumColors.accent.secondary }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: PremiumColors.error }]} />
              <Text style={styles.legendText}>Sold Out</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#666666' }]} />
              <Text style={styles.legendText}>Not Available</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PremiumColors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.background.primary,
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    textAlign: 'center',
  },
  backToEventButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: PremiumColors.accent.secondary,
    borderRadius: 12,
  },
  backToEventText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: PremiumColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
    marginBottom: 2,
  },
  headerLocation: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  layoutInfoContainer: {
    padding: 20,
    paddingBottom: 12,
  },
  layoutName: {
    fontSize: 22,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  layoutSubtext: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  legendContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
});

