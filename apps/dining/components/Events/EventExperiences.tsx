import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';
import { EventExperienceModal } from './EventExperienceModal';

interface Experience {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
}

interface EventExperiencesProps {
  experiences: Experience[];
}

export const EventExperiences: React.FC<EventExperiencesProps> = ({ experiences }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!experiences || experiences.length === 0) {
    return null;
  }

  const sortedExperiences = experiences.sort((a, b) => a.display_order - b.display_order);

  const handleExperiencePress = (index: number) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };

  return (
    <>
      <View style={styles.experiencesSection}>
        <Text style={styles.sectionTitle}>Event Experiences</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          {sortedExperiences.map((experience, index) => (
            <TouchableOpacity 
              key={experience.id} 
              style={styles.experienceCard}
              onPress={() => handleExperiencePress(index)}
              activeOpacity={0.8}
            >
              <View style={styles.experienceImageContainer}>
                <Image 
                  source={{ 
                    uri: experience.image_url || 
                    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=400&fit=crop' 
                  }} 
                  style={styles.experienceImage}
                />
              </View>
              <Text style={styles.experienceName} numberOfLines={2}>
                {experience.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <EventExperienceModal
        visible={modalVisible}
        experiences={sortedExperiences}
        initialIndex={selectedIndex}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  experiencesSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: PremiumColors.background.primary,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.secondary,
    marginBottom: 16,
  },
  horizontalScrollContainer: {
    paddingHorizontal: 4,
  },
  experienceCard: {
    width: 150,
    marginRight: 16,
    alignItems: 'center',
  },
  experienceImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: PremiumColors.background.secondary,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(117, 117, 117, 0.5)',
  },
  experienceImage: {
    width: '100%',
    height: '100%',
  },
  experienceName: {
    fontSize: 14,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  }
});

