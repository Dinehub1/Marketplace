import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Colors, Fonts, SCREEN_NAMES, Spacing } from '../../constants';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  image: string;
}

const onboardingData: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Find Trusted Doctors',
    description: 'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of it over 2000 years old.',
    image: '🩺',
  },
  {
    id: 2,
    title: 'Choose Best Doctors',
    description: 'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of it over 2000 years old.',
    image: '👩‍⚕️',
  },
  {
    id: 3,
    title: 'Easy Appointments',
    description: 'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of it over 2000 years old.',
    image: '📅',
  },
];

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < onboardingData.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.navigate(SCREEN_NAMES.LOGIN as never);
    }
  };

  const handleSkip = () => {
    navigation.navigate(SCREEN_NAMES.LOGIN as never);
  };

  const renderSlide = (slide: OnboardingSlide) => (
    <View style={styles.slide} key={slide.id}>
      <View style={styles.imageContainer}>
        <Text style={styles.emoji}>{slide.image}</Text>
      </View>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.description}>{slide.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderSlide(onboardingData[currentSlide])}
      </View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentSlide && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Skip"
          onPress={handleSkip}
          variant="text"
          style={styles.skipButton}
        />
        <Button
          title={currentSlide === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width - (Spacing.screenPadding * 2),
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: Fonts.size['3xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: Fonts.size.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.lg,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray300,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing['4xl'],
  },
  skipButton: {
    flex: 0,
    minWidth: 80,
  },
  nextButton: {
    flex: 0,
    minWidth: 120,
  },
});
