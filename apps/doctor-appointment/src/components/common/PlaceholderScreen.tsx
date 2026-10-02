import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Spacing } from '../../constants';
import { Header } from './Header';

interface PlaceholderScreenProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
  title,
  description = `This is the ${title} screen. Implementation coming soon.`,
  showBackButton = true,
}) => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={title}
        showBackButton={showBackButton}
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  title: {
    fontSize: Fonts.size['2xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.base,
  },
});
