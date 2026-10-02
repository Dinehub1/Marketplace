import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CollectedVouchersScreen() {
  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#131315" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collected Vouchers</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Empty State Content */}
        <View style={styles.contentContainer}>
          {/* Icon Section */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="gift-outline" size={80} color="#FFFFFF" />
            </View>
          </View>

          {/* Title and Description */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>No vouchers found</Text>
            <Text style={styles.description}>
              You haven't collected any vouchers yet. Start dining and attending events to earn exclusive vouchers and rewards!
            </Text>
          </View>

          {/* How to Earn Section */}
          <View style={styles.howToEarnContainer}>
            <Text style={styles.sectionTitle}>How to earn vouchers:</Text>
            
            <View style={styles.earnItem}>
              <View style={styles.earnIcon}>
                <Ionicons name="restaurant-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.earnText}>Complete restaurant bookings</Text>
            </View>
            
            <View style={styles.earnItem}>
              <View style={styles.earnIcon}>
                <Ionicons name="ticket-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.earnText}>Attend events and shows</Text>
            </View>
            
            <View style={styles.earnItem}>
              <View style={styles.earnIcon}>
                <Ionicons name="star-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.earnText}>Leave reviews and ratings</Text>
            </View>
            
            <View style={styles.earnItem}>
              <View style={styles.earnIcon}>
                <Ionicons name="people-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.earnText}>Refer friends to DropBy</Text>
            </View>
          </View>

          {/* Explore Button */}
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/')}
          >
            <Ionicons name="compass-outline" size={20} color="#FFFFFF" />
            <Text style={styles.exploreButtonText}>Explore restaurants & events</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#131315',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    backgroundColor: '#131315',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#131315',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#1e1e20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  howToEarnContainer: {
    width: '100%',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1b1c',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  earnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e1e20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  earnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e20',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    justifyContent: 'center',
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
